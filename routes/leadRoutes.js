const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  getLeadByPhone,
  getLeadCalls,
  deleteLead,
} = require('../controllers/leadController');
const { getLeadContext, saveVapiCall } = require('../controllers/contextController');

router.post('/context', getLeadContext); 

router.post('/list', getLeads);
router.post('/get', getLead);
router.post('/delete', deleteLead);
router.post('/get-by-phone', getLeadByPhone);
router.post('/calls', getLeadCalls);

module.exports = router;
