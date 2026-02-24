const express = require('express');
const router = express.Router();
const { scheduleCallback, getPendingCallbacks } = require('../controllers/callbackController');

router.post('/schedule', scheduleCallback);
router.post('/pending', getPendingCallbacks);

module.exports = router;
