import mongoose from 'mongoose';

const AyushAssessmentSchema = new mongoose.Schema({
  encounterId: { type: String, required: true, index: true },
  prakritiScores: {
    vata: Number,
    pitta: Number,
    kapha: Number
  },
  agniType: { type: String, enum: ['SAMA', 'VISHAMA', 'TIKSHNA', 'MANDA'] },
  koshtha: { type: String, enum: ['MRUDU', 'MADHYAMA', 'KRURA'] },
  aharaViharaNotes: String,
  dashavidhaSummary: String
}, { timestamps: true });

export default mongoose.model('AyushAssessment', AyushAssessmentSchema);
