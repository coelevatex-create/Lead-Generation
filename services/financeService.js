/**
 * Calculate EMI (Equated Monthly Installment)
 * Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * P: Principal loan amount
 * r: Monthly interest rate (annual rate / 12 / 100)
 * n: Tenure in months
 */
const calculateEmi = (amount, annualRate, tenureYears) => {
  if (!amount || !annualRate || !tenureYears) return null;

  const monthlyRate = annualRate / 12 / 100;
  const months = tenureYears * 12;

  const emi =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const totalPayment = emi * months;
  const totalInterest = totalPayment - amount;

  return {
    emi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
  };
};

module.exports = {
  calculateEmi,
};
