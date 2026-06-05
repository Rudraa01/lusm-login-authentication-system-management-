const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to authenticate super admin using JWT Bearer token.
 * Attaches admin info to req.admin
 */
const authAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }

  // Ensure this is a superadmin token
  if (decoded.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin authentication required.',
    });
  }

  req.admin = {
    email: decoded.email,
    role: decoded.role,
  };

  next();
};

module.exports = authAdmin;
