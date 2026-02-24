const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema(
  {
    vapiCallId: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    duration: Number,
    transcript: String,
    summary: String,
    
    // AI Tracking
    intent: String,
    income: Number,
    objections: [String],
    
    // Captured Data
    customerName: String,
    loanPurpose: String,

    sentiment: String,
    outcome: String,
    rawPayload: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Call', CallSchema);
