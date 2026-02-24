const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: null,
    },
    // Name Tracking
    lastSpokenName: { type: String },
    updatedFromCall: { type: Boolean, default: false },

    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      unique: true,
      trim: true,
      index: true,
    },
    city: String,
    income: Number,
    purpose: String,
    employmentType: String,
    cibilScore: Number,
    interestLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    stage: {
      type: String,
      enum: [
        'new',
        'contacted',
        'interested',
        'callback',
        'applied',
        'converted',
        'rejected',
      ],
      default: 'new',
    },
    
    // Financial Data
    loanPurpose: String,
    monthlyIncome: Number,
    existingEmi: Number,
    comfortableEmi: Number,
    
    // AI & Scoring
    trustScore: {
      type: Number,
      default: 50, // 0-100
    },
    leadScore: {
      type: Number, // 0-100 calculated
      default: 0,
    },
    
    // Personalization
    preferredLanguage: {
      type: String,
      enum: ['english', 'hindi', 'marathi', 'hinglish','English','Hindi','Marathi','Hinglish'],
      default: 'english',
    },
    // Memory Fields
    lastIntent: String,
    lastSummary: String,
    lastTranscript: String,
    
    // Workflow
    lastCalledAt: Date,
    callbackAt: Date,
    documentsStatus: {
      pan: { type: Boolean, default: false },
      aadhaar: { type: Boolean, default: false },
      bankStatement: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lead', LeadSchema);
