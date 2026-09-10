import express from 'express';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';

const prisma = new PrismaClient();
const router = express.Router();

// Middleware to ensure user is authenticated
const requireAuth = passport.authenticate('jwt', { session: false });

// GET /api/v1/patient/profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findFirst({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile.' });
  }
});

// PUT /api/v1/patient/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, dateOfBirth, gender, bloodGroup, contactNumber, emergencyContact, abhaNumber } = req.body;

    const existingProfile = await prisma.patientProfile.findFirst({
      where: { userId: req.user.id }
    });

    let profile;
    if (existingProfile) {
      profile = await prisma.patientProfile.update({
        where: { id: existingProfile.id },
        data: {
          fullName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          bloodGroup,
          contactNumber,
          emergencyContact,
          abhaNumber
        }
      });
    } else {
      profile = await prisma.patientProfile.create({
        data: {
          userId: req.user.id,
          fullName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01'),
          gender: gender || 'Not Specified',
          bloodGroup,
          contactNumber,
          emergencyContact,
          abhaNumber
        }
      });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ error: 'Failed to update patient profile.' });
  }
});

// GET /api/v1/patient/appointments
router.get('/appointments', requireAuth, async (req, res) => {
  try {
    const profile = await prisma.patientProfile.findFirst({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.json({ success: true, data: [] });
    }

    const encounters = await prisma.encounter.findMany({
      where: { patientId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { name: true } }
      }
    });

    const mapped = encounters.map(e => ({
      id: e.id,
      department: e.departmentId,
      status: e.status,
      priority: e.priorityLevel,
      doctorName: e.doctor?.name,
      createdAt: e.createdAt,
      triageCompletedAt: e.fhirBundle?.triageCompletedAt
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
});

export default router;
