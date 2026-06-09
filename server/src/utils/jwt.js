const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
  // Developer and admin sessions persist for 30 days to avoid frequent logouts.
  // Public API end-users retain standard short-lived tokens (configured via JWT_ACCESS_EXPIRY or defaulting to 15m).
  const isLongSession = payload.role === 'developer' || payload.role === 'superadmin';
  const expiry = isLongSession ? '30d' : (process.env.JWT_ACCESS_EXPIRY || '15m');

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiry,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
