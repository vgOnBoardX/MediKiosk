import mongoose from 'mongoose';

const ClinicalTranscriptSchema = new mongoose.Schema({
  patientId: {
    type: String, // Maps to Prisma User ID
    required: true,
    index: true
  },
  triageSessionId: {
    type: String,
    required: true,
    unique: true
  },
  transcript: [{
    role: {
      type: String,
      enum: ['user', 'ai', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  structuredSummary: {
    chiefComplaint: String,
    historyOfPresentIllness: String,
    pastMedicalHistory: String,
    reviewOfSystems: mongoose.Schema.Types.Mixed,
    dashavidhaPariksha: mongoose.Schema.Types.Mixed, // AYUSH specific
    redFlags: [String]
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'aborted'],
    default: 'in-progress'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ClinicalTranscriptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.ClinicalTranscript || mongoose.model('ClinicalTranscript', ClinicalTranscriptSchema);
