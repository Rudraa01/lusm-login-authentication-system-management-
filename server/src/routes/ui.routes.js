const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/ui
 * List all available pre-built UIs for developers
 * We make this endpoint relatively open but rate-limited so the dashboard can fetch it
 */
router.get('/', authLimiter, async (req, res) => {
  try {
    const uis = await prisma.prebuiltUi.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        htmlCode: true,
        cssCode: true,
        jsCode: true,
        reactCode: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    res.json({ success: true, data: uis });
  } catch (err) {
    console.error('List UIs error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
