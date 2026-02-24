const Lead = require('../models/Lead');
const Call = require('../models/Call');

// @desc    Get all leads
// @route   POST /api/leads/list
// @access  Public
const getLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.body.page, 10) || 1;
    const limit = parseInt(req.body.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Lead.countDocuments();
    const leads = await Lead.find()
      .skip(startIndex)
      .limit(limit)
      .sort({ updatedAt: -1 });

    const pagination = {};

    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: leads.length,
      pagination,
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead by ID
// @route   POST /api/leads/get
// @access  Public
const getLead = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Lead ID required' });

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead by Phone
// @route   POST /api/leads/get-by-phone
// @access  Public
const getLeadByPhone = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

    const lead = await Lead.findOne({ phone });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Get calls for a lead
// @route   POST /api/leads/calls
// @access  Public
const getLeadCalls = async (req, res, next) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ success: false, message: 'Lead ID required' });

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const calls = await Call.find({ phone: lead.phone }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: calls.length,
      data: calls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lead
// @route   POST /api/leads/delete
// @access  Public
const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Lead ID required' });

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    await lead.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeads,
  getLead,
  getLeadByPhone,
  getLeadCalls,
  deleteLead,
};
