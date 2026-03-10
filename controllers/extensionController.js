const { GoogleGenerativeAI } = require('@google/generative-ai');
const LoanPlan = require('../models/LoanPlan');
const { calculateEmi } = require('../services/financeService');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

// Category mapping from Gemini output to LoanPlan types
const CATEGORY_MAP = {
  'auto': 'car',
  'car': 'car',
  'vehicle': 'car',
  'bike': 'personal',
  'motorcycle': 'personal',
  'home': 'home',
  'house': 'home',
  'property': 'home',
  'real estate': 'home',
  'apartment': 'home',
  'flat': 'home',
  'electronics': 'personal',
  'laptop': 'personal',
  'phone': 'personal',
  'mobile': 'personal',
  'furniture': 'personal',
  'appliance': 'personal',
  'consumer durable': 'personal',
  'education': 'education',
  'course': 'education',
  'training': 'education',
  'university': 'education',
  'travel': 'personal',
  'vacation': 'personal',
  'business': 'business',
};

// @desc    Analyze page content and return loan recommendations
// @route   POST /api/extension/analyze
// @access  Public
const analyzePage = async (req, res, next) => {
  try {
    const { pageText, url } = req.body;

    if (!pageText) {
      return res.status(400).json({ success: false, message: 'pageText is required' });
    }

    // Truncate page text to avoid token limits
    const truncatedText = pageText.substring(0, 4000);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a product page analyzer for a financial services company. Analyze the following webpage content and extract product information.

URL: ${url || 'Unknown'}

Page Content:
${truncatedText}

Respond ONLY with a valid JSON object (no markdown, no code blocks) with these fields:
{
  "productName": "string - name of the product",
  "category": "string - one of: auto, car, home, property, electronics, laptop, phone, furniture, education, course, travel, business",
  "price": number or null - price in INR (just the number, no currency symbols),
  "currency": "INR",
  "keyDetails": ["array of 3-5 key product details as strings"],
  "purchaseType": "string - one of: vehicle, property, gadget, appliance, education, travel, business, other",
  "confidence": number between 0 and 1
}

If you cannot detect a product, set confidence to 0 and fill with reasonable defaults.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse JSON response
    let analysis;
    try {
      // Remove any markdown code blocks if present
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error('[Extension] Failed to parse Gemini response:', responseText);
      analysis = {
        productName: 'Unknown Product',
        category: 'other',
        price: null,
        currency: 'INR',
        keyDetails: [],
        purchaseType: 'other',
        confidence: 0
      };
    }

    // Map category to LoanPlan type
    const loanType = CATEGORY_MAP[analysis.category?.toLowerCase()] || 'personal';

    // Fetch matching loan plans
    const plans = await LoanPlan.find({ type: loanType });

    // Calculate EMI for each plan if price is available
    const recommendations = plans.map(plan => {
      const avgRate = (plan.minRate + plan.maxRate) / 2;
      const loanAmount = analysis.price ? Math.min(analysis.price, plan.maxAmount) : plan.maxAmount * 0.5;
      const tenure = Math.min(plan.maxTenure, plan.maxTenure); 
      const emiData = calculateEmi(loanAmount, avgRate, tenure);

      return {
        _id: plan._id,
        type: plan.type,
        loanName: `Tata Capital ${plan.type.charAt(0).toUpperCase() + plan.type.slice(1)} Loan`,
        interestRate: `${plan.minRate}% - ${plan.maxRate}%`,
        minRate: plan.minRate,
        maxRate: plan.maxRate,
        maxAmount: plan.maxAmount,
        maxTenure: plan.maxTenure,
        eligibilityRules: plan.eligibilityRules,
        estimatedEmi: emiData?.emi || null,
        totalInterest: emiData?.totalInterest || null,
        totalPayment: emiData?.totalPayment || null,
        loanAmount,
        tenure
      };
    });

    res.status(200).json({
      success: true,
      data: {
        analysis,
        loanType,
        recommendations,
        detectedPrice: analysis.price
      }
    });
  } catch (error) {
    console.error('[Extension] analyzePage error:', error);
    next(error);
  }
};

// @desc    AI Chat with AURA financial advisor
// @route   POST /api/extension/chat
// @access  Public
const chatWithAura = async (req, res, next) => {
  try {
    const { message, context, chatHistory } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build context string
    let contextStr = '';
    if (context) {
      contextStr = `
Current Product Context:
- Product: ${context.product || 'N/A'}
- Category: ${context.category || 'N/A'}
- Price: ${context.price ? `₹${Number(context.price).toLocaleString('en-IN')}` : 'N/A'}
- Key Details: ${context.keyDetails?.join(', ') || 'N/A'}`;
    }

    // Build chat history string
    let historyStr = '';
    if (chatHistory && chatHistory.length > 0) {
      historyStr = '\n\nPrevious Conversation:\n' + chatHistory.map(msg =>
        `${msg.role === 'user' ? 'User' : 'AURA'}: ${msg.content}`
      ).join('\n');
    }

    const prompt = `You are AURA, an AI financial advisor for Tata Capital. You help users understand how they can finance products they are viewing on the internet.

Your personality:
- Professional yet friendly
- Knowledgeable about loans, EMI, interest rates
- Concise and helpful (keep responses under 150 words)
- Always recommend Tata Capital products
- Use ₹ symbol for Indian Rupees
- Format numbers in Indian style (e.g., ₹12,00,000)

Available Loan Types at Tata Capital:
- Home Loan: 8.5% - 10%, up to ₹1 Cr, up to 30 years
- Car Loan: 9% - 12%, up to ₹50 Lakh, up to 7 years
- Personal Loan: 10.5% - 15%, up to ₹25 Lakh, up to 5 years
- Education Loan: 9.5% - 13%, up to ₹40 Lakh, up to 12 years
- Business Loan: 12% - 18%, up to ₹50 Lakh, up to 5 years

EMI Formula: E = P × r × (1+r)^n / ((1+r)^n - 1) where P=principal, r=monthly rate, n=months
${contextStr}
${historyStr}

User Question: ${message}

Respond helpfully and concisely. If relevant, include EMI calculations. Always be encouraging about Tata Capital products.`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    res.status(200).json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Extension] chatWithAura error:', error);
    next(error);
  }
};

// @desc    Check loan eligibility
// @route   POST /api/extension/eligibility
// @access  Public
const checkEligibility = async (req, res, next) => {
  try {
    const { monthlyIncome, existingEmi, creditScore, loanType, loanAmount } = req.body;

    if (!monthlyIncome) {
      return res.status(400).json({ success: false, message: 'monthlyIncome is required' });
    }

    const type = CATEGORY_MAP[loanType?.toLowerCase()] || loanType || 'personal';
    const plans = await LoanPlan.find({ type });

    if (!plans.length) {
      return res.status(200).json({
        success: true,
        data: {
          eligible: false,
          probability: 0,
          message: 'No loan plans available for this category.',
          factors: []
        }
      });
    }

    // Use the best plan (lowest rate)
    const plan = plans.sort((a, b) => a.minRate - b.minRate)[0];

    let score = 0;
    const factors = [];

    // Income check (40% weight)
    const incomeRatio = monthlyIncome / (plan.eligibilityRules?.minIncome || 25000);
    if (incomeRatio >= 1) {
      score += Math.min(incomeRatio * 20, 40);
      factors.push({ factor: 'Income', status: 'pass', detail: `Your income meets the minimum requirement of ₹${plan.eligibilityRules?.minIncome?.toLocaleString('en-IN')}` });
    } else {
      score += incomeRatio * 20;
      factors.push({ factor: 'Income', status: 'fail', detail: `Minimum income required: ₹${plan.eligibilityRules?.minIncome?.toLocaleString('en-IN')}` });
    }

    // Credit score check (30% weight)
    const cibil = creditScore || 700;
    const minCibil = plan.eligibilityRules?.minCibil || 650;
    if (cibil >= minCibil) {
      const cibilRatio = Math.min((cibil - 300) / 600, 1);
      score += cibilRatio * 30;
      factors.push({ factor: 'Credit Score', status: 'pass', detail: `Your score of ${cibil} meets the requirement of ${minCibil}` });
    } else {
      score += (cibil / 900) * 15;
      factors.push({ factor: 'Credit Score', status: 'warning', detail: `Recommended minimum: ${minCibil}. Your score: ${cibil}` });
    }

    // EMI-to-income ratio (20% weight) - should be under 50%
    const existingEmiVal = existingEmi || 0;
    const foir = existingEmiVal / monthlyIncome;
    if (foir < 0.3) {
      score += 20;
      factors.push({ factor: 'Debt-to-Income', status: 'pass', detail: 'Low existing EMI burden' });
    } else if (foir < 0.5) {
      score += 10;
      factors.push({ factor: 'Debt-to-Income', status: 'warning', detail: 'Moderate existing EMI burden' });
    } else {
      score += 5;
      factors.push({ factor: 'Debt-to-Income', status: 'fail', detail: 'High existing EMI burden' });
    }

    // Loan amount vs max amount (10% weight)
    const requestedAmount = loanAmount || plan.maxAmount * 0.5;
    if (requestedAmount <= plan.maxAmount) {
      score += 10;
      factors.push({ factor: 'Loan Amount', status: 'pass', detail: `Within max limit of ₹${plan.maxAmount.toLocaleString('en-IN')}` });
    } else {
      score += 3;
      factors.push({ factor: 'Loan Amount', status: 'fail', detail: `Exceeds max limit of ₹${plan.maxAmount.toLocaleString('en-IN')}` });
    }

    const probability = Math.min(Math.round(score), 100);

    let level = 'Low';
    if (probability >= 75) level = 'High';
    else if (probability >= 50) level = 'Medium';

    res.status(200).json({
      success: true,
      data: {
        eligible: probability >= 50,
        probability,
        level,
        message: probability >= 75
          ? `Great news! You have a high chance of loan approval with Tata Capital.`
          : probability >= 50
            ? `You have a moderate chance of approval. Consider improving your credit score for better rates.`
            : `You may face challenges. We recommend improving your credit score and reducing existing EMIs.`,
        factors,
        recommendedPlan: {
          type: plan.type,
          interestRate: `${plan.minRate}% - ${plan.maxRate}%`,
          maxAmount: plan.maxAmount,
          maxTenure: plan.maxTenure
        }
      }
    });
  } catch (error) {
    console.error('[Extension] checkEligibility error:', error);
    next(error);
  }
};

module.exports = {
  analyzePage,
  chatWithAura,
  checkEligibility
};
