const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken } = require('../utils/jwt');
const authAdmin = require('../middleware/authAdmin');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/admin/login
 * Super Admin Login (Env-based credentials)
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const envEmail = process.env.ADMIN_EMAIL || 'admin@lusm.dev';
    const envPassword = process.env.ADMIN_PASSWORD || 'admin123456';

    if (email !== envEmail || password !== envPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const accessToken = generateAccessToken({
      email: envEmail,
      role: 'superadmin',
    });

    res.json({
      success: true,
      message: 'Admin login successful.',
      data: {
        admin: {
          email: envEmail,
          role: 'superadmin',
        },
        accessToken,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/admin/me
 * Validate current admin session
 */
router.get('/me', authAdmin, async (req, res) => {
  res.json({
    success: true,
    data: {
      admin: {
        email: req.admin.email,
        role: req.admin.role,
      },
    },
  });
});

/**
 * GET /api/admin/stats
 * Platform-wide statistics
 */
router.get('/stats', authAdmin, async (req, res) => {
  try {
    const totalDevelopers = await prisma.developer.count();
    const totalProjects = await prisma.project.count();
    const totalEndUsers = await prisma.endUser.count();

    // Get projects with user count
    const projectsWithUserCount = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { endUsers: true } },
      },
    });

    // Recent 5 developers signed up
    const recentDevelopers = await prisma.developer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        totalDevelopers,
        totalProjects,
        totalEndUsers,
        recentDevelopers,
        projectsWithUserCount: projectsWithUserCount
          .map(p => ({ id: p.id, name: p.name, userCount: p._count.endUsers }))
          .sort((a, b) => b.userCount - a.userCount)
          .slice(0, 5),
      },
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/admin/developers
 * List developers with search, pagination and stats
 */
router.get('/developers', authAdmin, async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const total = await prisma.developer.count({ where });

    const developers = await prisma.developer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true,
        createdAt: true,
        _count: {
          select: { projects: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        developers: developers.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          isBlocked: d.isBlocked,
          createdAt: d.createdAt,
          projectCount: d._count.projects,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error('List developers error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/admin/developers/:id
 * Detailed developer view including their projects and end-user counts
 */
router.get('/developers/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const developer = await prisma.developer.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            apiKey: true,
            allowedOrigins: true,
            createdAt: true,
            _count: {
              select: { endUsers: true },
            },
          },
        },
      },
    });

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer not found.',
      });
    }

    res.json({
      success: true,
      data: {
        developer: {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          isBlocked: developer.isBlocked,
          createdAt: developer.createdAt,
          updatedAt: developer.updatedAt,
        },
        projects: developer.projects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          apiKey: p.apiKey,
          allowedOrigins: p.allowedOrigins,
          createdAt: p.createdAt,
          userCount: p._count.endUsers,
        })),
      },
    });
  } catch (err) {
    console.error('Get developer detail error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/admin/developers/:id/block
 * Block or unblock a developer
 */
router.put('/developers/:id/block', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (isBlocked === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isBlocked status is required.',
      });
    }

    const developer = await prisma.developer.findUnique({ where: { id } });
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer not found.',
      });
    }

    const updated = await prisma.developer.update({
      where: { id },
      data: { isBlocked },
      select: { id: true, name: true, email: true, isBlocked: true },
    });

    res.json({
      success: true,
      message: `Developer has been successfully ${isBlocked ? 'blocked' : 'unblocked'}.`,
      data: updated,
    });
  } catch (err) {
    console.error('Block developer error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * DELETE /api/admin/developers/:id
 * Delete a developer (Cascade delete will remove projects and end-users)
 */
router.delete('/developers/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const developer = await prisma.developer.findUnique({ where: { id } });
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer not found.',
      });
    }

    await prisma.developer.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Developer and all associated data deleted successfully.',
    });
  } catch (err) {
    console.error('Delete developer error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
