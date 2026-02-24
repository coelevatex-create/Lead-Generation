const Lead = require('../models/Lead');
const { calculateLeadScore } = require('../services/scoringService');

// @desc    Update lead score manually or trigger recalculation
// @route   POST /api/leads/:id/score
// @access  Public
const updateLeadScore = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const score = calculateLeadScore(lead);
    lead.leadScore = score;
    await lead.save();

    res.status(200).json({ success: true, data: { leadScore: score } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateLeadScore,
};
