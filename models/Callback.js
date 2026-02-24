const mongoose = require('mongoose');

const CallbackSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: false, // Changed: Lead is now optional
    },
    phone: {
      type: String,
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'missed'],
      default: 'pending',
    },
    assignedAgent: {
      type: String,
      default: 'AI', // or specific agent ID
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Callback', CallbackSchema);
