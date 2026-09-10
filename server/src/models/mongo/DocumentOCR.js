import mongoose from 'mongoose';

const DocumentOCRSchema = new mongoose.Schema({
  patientId: {
    type: String, // Maps to Prisma User ID
    required: true,
    index: true
  },
  documentUrl: {
    type: String, // Cloudinary URL
    required: true
  },
  documentType: {
    type: String,
    enum: ['prescription', 'lab_report', 'discharge_summary', 'other'],
    default: 'other'
  },
  ocrData: {
    diagnoses: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String
    }],
    investigations: [{
      testName: String,
      resultValue: String,
      referenceRange: String,
      isAbnormal: Boolean
    }],
    rawText: String // The raw Gemini Flash output if structuring fails
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.DocumentOCR || mongoose.model('DocumentOCR', DocumentOCRSchema);
