const express = require('express');
const router = express.Router();
const { calculateEmi } = require('../services/financeService');

// @desc    Calculate EMI
// @route   POST /api/finance/calculate-emi
// @access  Public
router.post('/calculate-emi', (req, res, next) => {
  try {
    const { amount, interestRate, tenureYears } = req.body;

    if (!amount || !interestRate || !tenureYears) {
      return res.status(400).json({ success: false, message: 'Please provide amount, interestRate, and tenureYears' });
    }

    const result = calculateEmi(amount, interestRate, tenureYears);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
