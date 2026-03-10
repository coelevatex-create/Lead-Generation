const express = require('express');
const router = express.Router();
const {
  analyzePage,
  chatWithAura,
  checkEligibility
} = require('../controllers/extensionController');

// @desc    Analyze page content for loan recommendations
// @route   POST /api/extension/analyze
router.post('/analyze', analyzePage);

// @desc    Chat with AURA AI financial advisor
// @route   POST /api/extension/chat
router.post('/chat', chatWithAura);

// @desc    Check loan eligibility
// @route   POST /api/extension/eligibility
router.post('/eligibility', checkEligibility);

module.exports = router;
