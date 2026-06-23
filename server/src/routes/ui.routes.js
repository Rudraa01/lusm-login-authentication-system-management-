const express = require('express');
const db = require('../utils/db');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * GET /api/v1/ui
 * List all available pre-built UIs for developers
 * We make this endpoint relatively open but rate-limited so the dashboard can fetch it
 */
router.get('/', authLimiter, async (req, res) => {
  try {
    const [uis] = await db.query(
      `SELECT id, title, description, type, htmlCode, cssCode, jsCode, reactCode, createdAt, updatedAt 
       FROM PrebuiltUi 
       ORDER BY createdAt DESC`
    );
    res.json({ success: true, data: uis });
  } catch (err) {
    console.error('List UIs error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/v1/ui/:id
 * Fetch a single prebuilt UI by ID for public previews
 */
router.get('/:id', authLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT id, title, description, type, htmlCode, cssCode, jsCode, reactCode, createdAt, updatedAt 
       FROM PrebuiltUi 
       WHERE id = ? LIMIT 1`,
      [id]
    );
    const ui = rows[0];
    if (!ui) {
      return res.status(404).json({ success: false, message: 'UI template not found.' });
    }
    res.json({ success: true, data: ui });
  } catch (err) {
    console.error('Fetch UI error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
