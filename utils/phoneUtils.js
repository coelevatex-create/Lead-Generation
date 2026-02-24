/**
 * Sanitizes phone number string
 * Removes unexpected characters like {{call.from}} if passed literally by LLM tools
 * @param {string} phone 
 * @returns {string} Sanitized phone number
 */
const sanitizePhone = (phone) => {
    if (!phone) return '';
    
    // Check if it's a template string literal from VAPI/LLM
    if (phone.includes('{{') || phone.includes('}}')) {
        return ''; // Invalid phone if it's still a template variable
    }

    // Basic sanitization: remove spaces, dashes, parens
    // Keep + if present
    return phone.replace(/[^\d+]/g, '').trim();
};

const validatePhone = (phone) => {
    const sanitized = sanitizePhone(phone);
    if (!sanitized) return false;
    // Basic E.164-ish check: + followed by 10-15 digits, or just 10-15 digits
    // Adjust regex as needed for locale (India: +91...)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(sanitized);
};

module.exports = {
    sanitizePhone,
    validatePhone
};
