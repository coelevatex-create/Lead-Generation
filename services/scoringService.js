/**
 * Calculate Lead Score (0-100)
 * Based on: Income, EMI ratio, Interest Level, Trust Score, Call Frequency
 */
const calculateLeadScore = (lead) => {
  let score = 0;

  // 1. Interest Level (Max 30)
  if (lead.interestLevel === 'high') score += 30;
  else if (lead.interestLevel === 'medium') score += 15;
  else score += 5;

  // 2. Income & Financial Health (Max 30)
  // Assuming basic healthy ratio: comfortable EMI should be > 0
  if (lead.monthlyIncome > 50000) score += 10;
  else if (lead.monthlyIncome > 25000) score += 5;

  if (lead.comfortableEmi > 0) {
      if (lead.comfortableEmi >= (lead.monthlyIncome * 0.2)) score += 20; // Willing to pay 20% of income
      else score += 10;
  }

  // 3. Trust Score (Max 20)
  // Normalize trust score (which is 0-100) to 20 points
  if (lead.trustScore) {
      score += Math.round((lead.trustScore / 100) * 20);
  }

  // 4. Engagement/Stage (Max 20)
  const positiveStages = ['interested', 'applied', 'converted', 'callback'];
  if (positiveStages.includes(lead.stage)) score += 20;
  else if (lead.stage === 'contacted') score += 10;

  // Cap at 100
  return Math.min(score, 100);
};

module.exports = {
  calculateLeadScore,
};
