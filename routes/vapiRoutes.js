const express = require('express');
const router = express.Router();
const { saveVapiCall } = require('../controllers/contextController');

// @desc    Save call data from VAPI structured output
// @route   POST /api/vapi/save-call
// @access  Public
router.post('/save-call', saveVapiCall);

module.exports = router;
