const Lead = require('../models/Lead');
const Call = require('../models/Call');
const Callback = require('../models/Callback'); // Assuming you created this model
const { calculateLeadScore } = require('../services/scoringService');
const { sanitizePhone } = require('../utils/phoneUtils');

// ... existing functions ...

// @desc    Get Lead Context for VAPI
// @route   POST /api/leads/context
// @access  Public
const getLeadContext = async (req, res, next) => {
  try {
    let { phone } = req.body;
    phone = sanitizePhone(phone);

    if (!phone) {
        return res.status(400).json({ error: 'Phone number required' });
    }

    const lead = await Lead.findOne({ phone });

    if (!lead) {
        // Return minimal context for new user
        return res.status(200).json({
            isNewUser: true,
            name: null,
            loanPurpose: null,
            context: 'First time caller.'
        });
    }

    // Context for AI
    const context = {
        isNewUser: false,
        name: lead.name || null,
        loanPurpose: lead.loanPurpose || null,
        income: lead.monthlyIncome || null,
        language: lead.preferredLanguage || 'english',
        
        // Persisted Memory
        lastSummary: lead.lastSummary || lead.lastCallSummary || null,
        lastIntent: lead.lastIntent || 'None',
        stage: lead.stage,
        
        trustScore: lead.trustScore,
        preferredLanguage: lead.preferredLanguage,
        leadScore: lead.leadScore
    };

    res.status(200).json(context);
  } catch (error) {
    next(error);
  }
};

// @desc    Save VAPI Call Data & Structured Output
// @route   POST /api/vapi/save-call
// @access  Public
const saveVapiCall = async (req, res, next) => {
    try {
        const {
            call_id,
            phone, 
            summary,
            transcript,
            structuredData // extracted fields: intent, income, objections
        } = req.body;
        
        // 1. Validation
        if (!phone || !call_id) {
             console.error('[Error] Missing required fields in save-call:', { phone, call_id });
             return res.status(400).json({ success: false, message: 'Phone number and call_id required' });
        }
        
        const sanitizedPhone = sanitizePhone(phone);
        if (!sanitizedPhone) {
            console.error('[Error] Invalid phone number:', phone);
            return res.status(400).json({ success: false, message: 'Invalid phone number' });
        }

        // 2. Find or Create Lead
        let lead = await Lead.findOne({ phone: sanitizedPhone });
        let isNewLead = false;

        if (!lead) {
            lead = new Lead({ 
                phone: sanitizedPhone,
                stage: 'contacted'
            });
            isNewLead = true;
            console.log(`[Lead Created] New lead for ${sanitizedPhone}`);
        }

        // 3. Update Lead Memory & Name Logic
        if (structuredData) {
            // Name Handling
            if (structuredData.name) {
                if (!lead.name) {
                    lead.name = structuredData.name;
                    console.log(`[Lead Update] Name set to: ${lead.name}`);
                } else if (lead.name !== structuredData.name) {
                    lead.lastSpokenName = structuredData.name;
                    console.log(`[Lead Update] lastSpokenName updated: ${structuredData.name} (Original: ${lead.name})`);
                }
            }
            
            lead.updatedFromCall = true;

            if (structuredData.income) lead.monthlyIncome = structuredData.income;
            if (structuredData.purpose) lead.loanPurpose = structuredData.purpose;
            if (structuredData.language) lead.preferredLanguage = structuredData.language;
            if (structuredData.trustScore) lead.trustScore = structuredData.trustScore;
            
            // New Memory Fields
            if (structuredData.intent) lead.lastIntent = structuredData.intent;
        }
        
        // Operational updates
        if (summary) lead.lastSummary = summary;
        if (transcript) lead.lastTranscript = transcript; // truncated if needed
        
        lead.lastCalledAt = new Date();
        
        // Recalculate Score
        lead.leadScore = calculateLeadScore(lead);
        await lead.save();

        
        if (!isNewLead) console.log(`[Lead Updated] Updated lead: ${lead._id}`);

        // 4. Save Call Record
        await Call.create({
            vapiCallId: call_id,
            phone: sanitizedPhone,
            lead: lead._id, // Link to lead
            summary,
            transcript,
            
            // Tracked Fields
            customerName: structuredData?.name,
            loanPurpose: structuredData?.purpose,
            intent: structuredData?.intent,
            income: structuredData?.income,
            objections: structuredData?.objections, // Array
            
            rawPayload: req.body
        });
        
        console.log(`[Call Saved] Call ${call_id} linked to Lead ${lead._id}`);

        res.status(200).json({ success: true, leadId: lead._id, leadScore: lead.leadScore });

    } catch (error) {
        console.error('[Error] saveVapiCall failed:', error);
        next(error);
    }
};

module.exports = {
  // ... existing exports
  getLeadContext,
  saveVapiCall
};
