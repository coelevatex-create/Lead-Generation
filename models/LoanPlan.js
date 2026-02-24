const mongoose = require('mongoose');

const LoanPlanSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['home', 'personal', 'car', 'business', 'education'],
    },
    minRate: Number,
    maxRate: Number,
    maxTenure: Number, // in years
    maxAmount: Number,
    eligibilityRules: {
      minIncome: Number,
      minCibil: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LoanPlan', LoanPlanSchema);
