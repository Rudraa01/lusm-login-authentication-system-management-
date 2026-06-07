const { verifyAccessToken } = require('../utils/jwt');
const db = require('../utils/db');

/**
 * Middleware to authenticate developers using JWT Bearer token.
 * Attaches developer info to req.developer
 */
const authDeveloper = async (req, res, next) => {
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

  // Ensure this is a developer token
  if (decoded.role !== 'developer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Developer authentication required.',
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, email, isBlocked FROM Developer WHERE id = ? LIMIT 1',
      [decoded.id]
    );
    const developer = rows[0];

    if (!developer) {
      return res.status(401).json({
        success: false,
        message: 'Developer account not found.',
      });
    }

    if (developer.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your developer account has been blocked. Please contact support.',
      });
    }

    req.developer = {
      id: developer.id,
      email: developer.email,
    };

    next();
  } catch (err) {
    console.error('authDeveloper middleware error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = authDeveloper;

