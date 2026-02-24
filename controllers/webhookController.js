const Lead = require('../models/Lead');
const Call = require('../models/Call');

// @desc    Handle VAPI Webhook
// @route   POST /webhook/vapi
// @access  Public
const handleWebhook = async (req, res, next) => {
  try {
    const { message } = req.body;

    // VAPI sends different message types. We are interested in 'end-of-call-report'
    // or checks to ensure the server is alive.
    if (!message || message.type !== 'end-of-call-report') {
      return res.status(200).json({ message: 'Webhook received' });
    }

    const { call, transcript, summary, analysis, artifact } = message;

    // Create Call Data Object (but don't save yet until we have lead)
    const callData = {
      vapiCallId: call.id,
      phone: call.customer.number,
      duration: call.duration || 0,
      transcript: transcript || '', 
      summary: summary || analysis?.summary || '',
      sentiment: analysis?.sentiment || 'neutral',
      outcome: analysis?.structuredData?.outcome || analysis?.outcome || 'unknown',
      
      // New Tracking Fields
      intent: analysis?.structuredData?.intent,
      income: analysis?.structuredData?.income,
      objections: analysis?.structuredData?.objections,

      rawPayload: req.body,
    };

    // 1. Find or Create Lead
    let lead = await Lead.findOne({ phone: callData.phone });

    if (lead) {
      // Update existing lead
      lead.stage = mapOutcomeToStage(callData.outcome) || lead.stage;
      lead.interestLevel = mapSentimentToInterest(callData.sentiment) || lead.interestLevel;
      lead.lastCalledAt = new Date();
      
      // Memory Updates
      if (callData.summary) lead.lastSummary = callData.summary;
      if (callData.transcript) lead.lastTranscript = callData.transcript;
      if (callData.intent) lead.lastIntent = callData.intent;
      if (callData.income) lead.monthlyIncome = callData.income;

      await lead.save();
    } else {
      // Create new lead
      lead = await Lead.create({
        phone: callData.phone,
        stage: mapOutcomeToStage(callData.outcome) || 'new',
        interestLevel: mapSentimentToInterest(callData.sentiment) || 'low',
        lastCalledAt: new Date(),
        
        // Memory Updates
        lastSummary: callData.summary,
        lastTranscript: callData.transcript,
        lastIntent: callData.intent,
        monthlyIncome: callData.income
      });
    }

    // 2. Create Call Record with Lead Link
    callData.lead = lead._id;
    await Call.create(callData);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Helper to map VAPI outcome to Lead Stage
const mapOutcomeToStage = (outcome) => {
  if (!outcome) return null;
  const lowerOutcome = outcome.toString().toLowerCase();

  // Mapping logic - adjust based on actual VAPI outcome strings
  if (lowerOutcome.includes('interested')) return 'interested';
  if (lowerOutcome.includes('callback') || lowerOutcome.includes('later')) return 'callback';
  if (lowerOutcome.includes('not interested') || lowerOutcome.includes('busy')) return 'rejected';
  if (lowerOutcome.includes('voicemail')) return 'contacted';
  
  return 'contacted'; // Default
};

// Helper to map Sentiment to Interest Level
const mapSentimentToInterest = (sentiment) => {
  if (!sentiment) return 'low';
  const lowerSentiment = sentiment.toString().toLowerCase();

  if (lowerSentiment === 'positive') return 'high';
  if (lowerSentiment === 'neutral') return 'medium';
  if (lowerSentiment === 'negative') return 'low';

  return 'low';
};

module.exports = {
  handleWebhook,
};
