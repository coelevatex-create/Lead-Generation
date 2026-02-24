const express = require('express');
const router = express.Router();
const LoanPlan = require('../models/LoanPlan');

// @desc    Get all loan plans
// @route   POST /api/plans/list
// @access  Public
router.post('/list', async (req, res, next) => {
  try {
    const plans = await LoanPlan.find();
    res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
});

// @desc    Get plans by type
// @route   POST /api/plans/get-by-type
// @access  Public
router.post('/get-by-type', async (req, res, next) => {
    try {
      const { type } = req.body;
      const plans = await LoanPlan.find({ type: type });
      res.status(200).json({ success: true, count: plans.length, data: plans });
    } catch (error) {
      next(error);
    }
  });

// @desc    Seed default plans
// @route   POST /api/plans/seed
// @access  Public (Should be protected in prod)
router.post('/seed', async (req, res, next) => {
  try {
    await LoanPlan.deleteMany(); // Clear existing

    const plans = [
      // Personal Loans
      {
        type: 'personal',
        minRate: 10.5,
        maxRate: 14.0,
        maxTenure: 5,
        maxAmount: 2500000,
        eligibilityRules: { minIncome: 25000, minCibil: 700 }
      },
      {
        type: 'personal',
        minRate: 11.0,
        maxRate: 15.0,
        maxTenure: 3,
        maxAmount: 1000000,
        eligibilityRules: { minIncome: 20000, minCibil: 650 }
      },

      // Home Loans
      {
        type: 'home',
        minRate: 8.5,
        maxRate: 9.5,
        maxTenure: 30,
        maxAmount: 10000000, // 1 Cr
        eligibilityRules: { minIncome: 40000, minCibil: 750 }
      },
      {
        type: 'home',
        minRate: 9.0,
        maxRate: 10.0,
        maxTenure: 25,
        maxAmount: 7500000, // 75L
        eligibilityRules: { minIncome: 35000, minCibil: 700 }
      },

      // Car Loans
      {
        type: 'car',
        minRate: 9.0,
        maxRate: 11.0,
        maxTenure: 7,
        maxAmount: 5000000,
        eligibilityRules: { minIncome: 30000, minCibil: 700 }
      },
      {
        type: 'car',
        minRate: 9.5,
        maxRate: 12.0,
        maxTenure: 5,
        maxAmount: 2000000,
        eligibilityRules: { minIncome: 25000, minCibil: 680 }
      },

      // Education Loans
      {
        type: 'education',
        minRate: 9.5,
        maxRate: 12.0,
        maxTenure: 12,
        maxAmount: 4000000,
        eligibilityRules: { minIncome: 15000, minCibil: 0 } 
      },
      {
        type: 'education',
        minRate: 10.0,
        maxRate: 13.0,
        maxTenure: 10,
        maxAmount: 2000000,
        eligibilityRules: { minIncome: 10000, minCibil: 0 }
      },

      // Business Loans
      {
        type: 'business',
        minRate: 12.0,
        maxRate: 16.0,
        maxTenure: 5,
        maxAmount: 5000000,
        eligibilityRules: { minIncome: 50000, minCibil: 700 }
      },
      {
        type: 'business',
        minRate: 13.0,
        maxRate: 18.0,
        maxTenure: 3,
        maxAmount: 2000000,
        eligibilityRules: { minIncome: 40000, minCibil: 650 }
      }
    ];

    await LoanPlan.insertMany(plans);
    res.status(201).json({ success: true, message: 'Plans seeded' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
