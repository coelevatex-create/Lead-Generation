const crypto = require('crypto');

const validateVapiSignature = (req, res, next) => {
  try {
    const vapiSecret = process.env.VAPI_SECRET;

    // If no secret is set, skip validation (Dev mode only warning)
    if (!vapiSecret) {
      console.warn('WARNING: VAPI_SECRET not set. Skipping signature validation.');
      return next();
    }

    const signature = req.headers['x-vapi-signature'];
    
    if (!signature) {
      return res.status(401).json({ message: 'Unauthorized: No signature provided' });
    }

    // req.rawBody is expected to be set by a body-parser middleware configured to save the raw body.
    if (!req.rawBody) {
        console.error('Error: rawBody not available for signature verification. Ensure body-parser is configured to save rawBody.');
        return res.status(500).json({ message: 'Server configuration error: rawBody missing for signature verification' });
    }

    // Compute the HMAC SHA256 of the request body using your VAPI Secret.
    const hmac = crypto.createHmac('sha256', vapiSecret);
    hmac.update(req.rawBody);
    const calculatedSignature = hmac.digest('hex');

    if (calculatedSignature !== signature) {
        return res.status(403).json({ message: 'Forbidden: Invalid signature' });
    }
    
    next();
  } catch (error) {
    console.error('Validation Error:', error);
    res.status(500).json({ message: 'Internal Server Error during validation' });
  }
};

module.exports = validateVapiSignature;
