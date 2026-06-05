const crypto = require('crypto');

/**
 * Generate a random 6-digit OTP code
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Get OTP expiry time (10 minutes from now)
 */
const getOtpExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
};

module.exports = {
  generateOtp,
  getOtpExpiry,
};
