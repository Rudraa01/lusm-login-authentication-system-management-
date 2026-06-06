const crypto = require('crypto');

/**
 * Validates a password based on strict rules:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 '@' symbol
 * - No other special characters allowed except '@'
 */
function validateStrongPassword(password) {
  if (!password) return false;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*@)[A-Za-z0-9@]{8,}$/;
  return regex.test(password);
}

/**
 * Generates a random strong password meeting the above criteria.
 */
function generateStrongPassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const num = '0123456789';
  const sym = '@';
  
  let passwordArray = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    num[crypto.randomInt(0, num.length)],
    sym
  ];
  
  const allChars = upper + lower + num + sym;
  
  // Add 4 more random characters to reach min length 8
  for (let i = 0; i < 4; i++) {
    passwordArray.push(allChars[crypto.randomInt(0, allChars.length)]);
  }
  
  // Shuffle array securely
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

module.exports = {
  validateStrongPassword,
  generateStrongPassword
};
