import mongoose from 'mongoose';

const MedicalDocumentSchema = new mongoose.Schema({
  encounterId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  cloudinaryUrl: { type: String, required: true },
  documentType: { type: String, enum: ['PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY', 'OTHER'], required: true },
  ocrRawText: { type: String },
  parsedEntities: {
    diagnoses: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String
    }],
    abnormalValues: [String]
  }
}, { timestamps: true });

export default mongoose.model('MedicalDocument', MedicalDocumentSchema);
