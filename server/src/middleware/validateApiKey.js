const db = require('../utils/db');

/**
 * Middleware to validate API key from x-api-key header.
 * Also checks CORS origin against the project's allowed origins.
 * Attaches the project to req.project.
 */
const validateApiKey = async (req, res, next) => {
  // Bypass validation for CORS preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required. Provide it in the x-api-key header.',
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT p.*, d.name AS developerName, d.email AS developerEmail 
       FROM Project p
       JOIN Developer d ON p.developerId = d.id
       WHERE p.apiKey = ? LIMIT 1`,
      [apiKey]
    );
    const rawProject = rows[0];

    if (!rawProject) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key.',
      });
    }

    const project = {
      id: rawProject.id,
      name: rawProject.name,
      description: rawProject.description,
      logoUrl: rawProject.logoUrl,
      apiKey: rawProject.apiKey,
      allowedOrigins: rawProject.allowedOrigins,
      developerId: rawProject.developerId,
      createdAt: rawProject.createdAt,
      updatedAt: rawProject.updatedAt,
      developer: {
        name: rawProject.developerName,
        email: rawProject.developerEmail,
      }
    };

    // Check origin if allowedOrigins is set
    const origin = req.headers.origin || req.headers.referer || '';
    if (project.allowedOrigins && project.allowedOrigins.trim() !== '') {
      const allowed = project.allowedOrigins
        .split(',')
        .map((o) => o.trim().toLowerCase());

      // In development, allow requests without origin (e.g., Postman, cURL)
      if (origin) {
        const requestOrigin = origin.toLowerCase().replace(/\/$/, '');
        const isAllowed = allowed.some(
          (ao) =>
            requestOrigin === ao ||
            requestOrigin.startsWith(ao) ||
            ao === '*'
        );

        if (!isAllowed) {
          return res.status(403).json({
            success: false,
            message: `Origin '${origin}' is not allowed for this API key. Add it to your project's allowed origins in the AuthEasy dashboard.`,
          });
        }
      }
    }

    req.project = project;
    next();
  } catch (err) {
    console.error('API Key validation error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during API key validation.',
    });
  }
};

/**
 * Middleware to authenticate end-users using Bearer token (used after validateApiKey).
 * Attaches end-user info to req.endUser
 */
const authEndUser = (req, res, next) => {
  const { verifyAccessToken } = require('../utils/jwt');

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No user token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired user token.',
    });
  }

  if (decoded.role !== 'enduser') {
    return res.status(403).json({
      success: false,
      message: 'Invalid token type.',
    });
  }

  req.endUser = {
    id: decoded.id,
    email: decoded.email,
    projectId: decoded.projectId,
  };

  next();
};

module.exports = { validateApiKey, authEndUser };
