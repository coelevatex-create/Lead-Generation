const Callback = require('../models/Callback');
const Lead = require('../models/Lead');
const { sanitizePhone } = require('../utils/phoneUtils');

// @desc    Schedule a callback
// @route   POST /api/callbacks/schedule
// @access  Public
const scheduleCallback = async (req, res, next) => {
  try {
    let { phone, scheduledAt, reason } = req.body;
    phone = sanitizePhone(phone);

    if (!phone || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Phone and Schedule time required' });
    }

    // 1. Try to find existing lead
    let lead = await Lead.findOne({ phone });
    
    // 2. If lead exists, update its stage/schedule
    if (lead) {
        lead.callbackAt = scheduledAt;
        lead.stage = 'callback';
        
        // Update memory if reason provided
        if (reason) lead.lastIntent = `Callback: ${reason}`;
        
        await lead.save();
    }

    // 3. Create Callback record (Lead ID is optional now)
    const callback = await Callback.create({
      lead: lead ? lead._id : undefined, 
      phone,
      scheduledAt,
      reason,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: callback });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending callbacks
// @route   POST /api/callbacks/pending
// @access  Public
const getPendingCallbacks = async (req, res, next) => {
    try {
        // Get callbacks scheduled for the past (missed) or next 24 hours
        // For simplicity, just all pending
        const callbacks = await Callback.find({ status: 'pending' })
            .sort({ scheduledAt: 1 })
            .populate('lead', 'name leadScore');

        res.status(200).json({ success: true, count: callbacks.length, data: callbacks });
    } catch (error) {
        next(error);
    }
};

module.exports = {
  scheduleCallback,
  getPendingCallbacks
};
