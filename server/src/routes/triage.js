import express from 'express';
import ClinicalTranscript from '../models/mongo/ClinicalTranscript.js';
import { PrismaClient } from '@prisma/client';
import { notificationQueue } from '../services/queue.js';

const prisma = new PrismaClient();
const router = express.Router();

// POST /triage/complete — Save triage and broadcast to dashboards
router.post('/complete', async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      department,
      severity,
      socratesData,
      ayushData,
      chatHistory,
      abhaId,
      suggestedDepartment
    } = req.body;

    // Determine the actual department from AI or fallback
    const finalDepartment = suggestedDepartment || department || 'GENERAL_MEDICINE';
    const finalSeverity = severity || 'ROUTINE';

    // Save full clinical transcript to MongoDB
    const transcript = new ClinicalTranscript({
      patientId: patientId || 'walk-in',
      clinicalSummary: buildClinicalSummary(socratesData, ayushData),
      rawTranscript: chatHistory,
      extractedEntities: {
        socratesData: socratesData || {},
        ayushData: ayushData || {},
        suggestedDepartment: finalDepartment,
        severity: finalSeverity
      }
    });
    await transcript.save();

    // Find or create a generic Kiosk User
    const user = await prisma.user.upsert({
      where: { email: 'kiosk@sanjeevani.local' },
      update: {},
      create: {
        email: 'kiosk@sanjeevani.local',
        name: 'Kiosk System User',
        role: 'PATIENT'
      }
    });

    // Create unique ID if no ABHA is provided
    const uniqueAbha = abhaId ? abhaId : 'WALK-IN-' + Date.now();

    // Find or create PatientProfile
    const patient = await prisma.patientProfile.upsert({
      where: { abhaNumber: uniqueAbha },
      update: {
        fullName: patientName || 'Kiosk Patient'
      },
      create: {
        userId: user.id,
        abhaNumber: uniqueAbha,
        fullName: patientName || 'Kiosk Patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Not Specified'
      }
    });

    // Create Encounter with the MongoDB transcript reference
    const encounter = await prisma.encounter.create({
      data: {
        patientId: patient.id,
        departmentId: finalDepartment,
        status: 'WAITING',
        priorityLevel: finalSeverity,
        fhirBundle: {
          mongoTranscriptId: transcript._id.toString(),
          socratesData: socratesData || {},
          ayushData: ayushData || {},
          triageCompletedAt: new Date().toISOString()
        }
      },
      include: {
        patient: true
      }
    });
    
    // Broadcast via WebSocket
    if (req.app.get('io')) {
      const io = req.app.get('io');
      const payload = {
        type: 'NEW_PATIENT_TRIAGE',
        data: {
          id: encounter.id,
          name: patient.fullName,
          priority: encounter.priorityLevel,
          department: encounter.departmentId,
          socratesData: socratesData || {},
          time: 'Just now'
        }
      };
      io.to('triage').emit('triage-alert', payload);
      
      // Also emit to specific doctor department
      if (finalDepartment) {
        io.to(`dept:${finalDepartment}`).emit('triage-alert', payload);
      }
    }

    // Queue email notification for triage summary
    await notificationQueue.add('triage_summary', {
      patientName: patient.fullName,
      department: finalDepartment,
      severity: finalSeverity,
      encounterId: encounter.id,
      socratesData: socratesData || {}
    });

    res.json({ success: true, message: 'Triage saved and broadcasted', encounterId: encounter.id });
  } catch (error) {
    console.error('Triage save error:', error);
    res.status(500).json({ error: 'Failed to save triage' });
  }
});

// GET /triage/queue/:department — Fetch current queue for a department
router.get('/queue/:department', async (req, res) => {
  try {
    const isTriage = req.params.department === 'triage';
    
    const encounters = await prisma.encounter.findMany({
      where: {
        status: { in: ['WAITING', 'TRIAGED'] },
        ...(isTriage ? {} : { departmentId: req.params.department })
      },
      include: {
        patient: true
      },
      orderBy: [
        { priorityLevel: 'desc' }, // EMERGENCY first, then URGENT, then ROUTINE
        { createdAt: 'asc' }       // Within same priority, FIFO
      ]
    });
    
    const mapped = encounters.map(e => {
      const diffMs = Date.now() - new Date(e.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return {
        id: e.id,
        name: e.patient.fullName,
        priority: e.priorityLevel,
        department: e.departmentId,
        status: e.status,
        socratesData: e.fhirBundle?.socratesData || {},
        ayushData: e.fhirBundle?.ayushData || {},
        mongoTranscriptId: e.fhirBundle?.mongoTranscriptId || null,
        time: diffMins === 0 ? 'Just now' : `${diffMins} min${diffMins > 1 ? 's' : ''}`
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Queue fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// GET /triage/encounter/:id — Fetch full encounter detail with transcript
router.get('/encounter/:id', async (req, res) => {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        doctor: true
      }
    });

    if (!encounter) {
      return res.status(404).json({ error: 'Encounter not found' });
    }

    // Fetch the MongoDB transcript if we have a reference
    let transcript = null;
    const mongoId = encounter.fhirBundle?.mongoTranscriptId;
    if (mongoId) {
      try {
        transcript = await ClinicalTranscript.findById(mongoId).lean();
      } catch (mongoErr) {
        console.warn('Could not fetch MongoDB transcript:', mongoErr.message);
      }
    }

    const diffMs = Date.now() - new Date(encounter.createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    res.json({
      id: encounter.id,
      name: encounter.patient.fullName,
      abhaNumber: encounter.patient.abhaNumber,
      priority: encounter.priorityLevel,
      department: encounter.departmentId,
      status: encounter.status,
      waitTime: diffMins === 0 ? 'Just now' : `${diffMins} min${diffMins > 1 ? 's' : ''}`,
      socratesData: encounter.fhirBundle?.socratesData || {},
      ayushData: encounter.fhirBundle?.ayushData || {},
      triageCompletedAt: encounter.fhirBundle?.triageCompletedAt || null,
      chatTranscript: transcript?.rawTranscript || [],
      clinicalSummary: transcript?.clinicalSummary || '',
      createdAt: encounter.createdAt
    });
  } catch (error) {
    console.error('Encounter fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch encounter details' });
  }
});

// PATCH /triage/encounter/:id/status — Update encounter status
router.patch('/encounter/:id/status', async (req, res) => {
  try {
    const { status, doctorId } = req.body;
    
    const validStatuses = ['WAITING', 'TRIAGED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'REFERRED_UP'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updateData = { status };
    if (doctorId) {
      updateData.doctorId = doctorId;
    }

    const encounter = await prisma.encounter.update({
      where: { id: req.params.id },
      data: updateData,
      include: { patient: true }
    });

    // Broadcast status change via WebSocket
    if (req.app.get('io')) {
      const io = req.app.get('io');
      const payload = {
        type: 'ENCOUNTER_STATUS_CHANGE',
        data: {
          id: encounter.id,
          name: encounter.patient.fullName,
          status: encounter.status,
          priority: encounter.priorityLevel,
          department: encounter.departmentId
        }
      };
      io.to('triage').emit('triage-alert', payload);
      if (encounter.departmentId) {
        io.to(`dept:${encounter.departmentId}`).emit('triage-alert', payload);
      }
    }

    res.json({ success: true, encounter: { id: encounter.id, status: encounter.status } });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update encounter status' });
  }
});

// Helper: Build a clinical summary string from SOCRATES data
function buildClinicalSummary(socratesData, ayushData) {
  if (!socratesData || Object.keys(socratesData).length === 0) {
    return 'Triage complete — no structured SOCRATES data extracted.';
  }

  const parts = [];
  if (socratesData.site) parts.push(`Site: ${socratesData.site}`);
  if (socratesData.onset) parts.push(`Onset: ${socratesData.onset}`);
  if (socratesData.character) parts.push(`Character: ${socratesData.character}`);
  if (socratesData.radiation) parts.push(`Radiation: ${socratesData.radiation}`);
  if (socratesData.associations) parts.push(`Associations: ${socratesData.associations}`);
  if (socratesData.time_course) parts.push(`Time course: ${socratesData.time_course}`);
  if (socratesData.exacerbating_relieving) parts.push(`Exacerbating/Relieving: ${socratesData.exacerbating_relieving}`);
  if (socratesData.severity) parts.push(`Severity: ${socratesData.severity}`);

  let summary = `SOCRATES Assessment: ${parts.join(' | ')}`;

  if (ayushData && Object.keys(ayushData).length > 0) {
    summary += ` | AYUSH: ${JSON.stringify(ayushData)}`;
  }

  return summary;
}

export default router;
