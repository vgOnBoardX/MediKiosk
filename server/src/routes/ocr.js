import express from 'express';
import { upload } from '../middlewares/upload.js';
import { GoogleGenAI } from '@google/genai';
import MedicalDocument from '../models/mongo/MedicalDocument.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/scan', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document provided' });
    }

    const cloudinaryUrl = req.file.path;
    const { encounterId, patientId } = req.body; // should be passed by client
    
    const imgResponse = await fetch(cloudinaryUrl);
    const buffer = await imgResponse.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = req.file.mimetype;

    const prompt = `You are a medical OCR assistant. Analyze this medical document.
Extract the following information in strict JSON format:
{
  "documentType": "PRESCRIPTION | LAB_REPORT | DISCHARGE_SUMMARY | OTHER",
  "date": "YYYY-MM-DD or string if unavailable",
  "diagnoses": ["string array of diseases or conditions"],
  "medications": [
    { "name": "string", "dosage": "string", "frequency": "string" }
  ],
  "abnormalValues": ["string array of any abnormal lab results or critical red flags, e.g. 'High Fasting Sugar: 145 mg/dL'"]
}
Return only JSON.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsedData = JSON.parse(result.text);

    // Save to Mongo using the MedicalDocument schema
    const doc = new MedicalDocument({
      encounterId: encounterId || 'unknown_encounter',
      patientId: patientId || 'temp_patient',
      cloudinaryUrl: cloudinaryUrl,
      documentType: parsedData.documentType || 'OTHER',
      ocrRawText: result.text,
      parsedEntities: {
        diagnoses: parsedData.diagnoses || [],
        medications: parsedData.medications || [],
        abnormalValues: parsedData.abnormalValues || []
      }
    });
    await doc.save();

    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

router.get('/documents/:patientId', async (req, res) => {
  try {
    const documents = await MedicalDocument.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

export default router;
