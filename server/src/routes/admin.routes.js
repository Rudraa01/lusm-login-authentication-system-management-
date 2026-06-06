const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validateStrongPassword, generateStrongPassword } = require('../utils/passwordUtil');
const { generateAccessToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/mailer');
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

/**
 * GET /api/admin/analytics
 * Platform analytics and developer leaderboard
 */
router.get('/analytics', authAdmin, async (req, res) => {
  try {
    const totalDevelopers = await prisma.developer.count();
    const totalProjects = await prisma.project.count();
    const totalEndUsers = await prisma.endUser.count();
    const totalRequests = await prisma.apiRequestLog.count();

    // Requests in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const requests24h = await prisma.apiRequestLog.count({
      where: {
        createdAt: { gte: oneDayAgo },
      },
    });

    // Request counts for the past 7 days (trend line)
    const dailyRequests = [];
    for (let i = 6; i >= 0; i--) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      startOfDay.setDate(startOfDay.getDate() - i);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      endOfDay.setDate(endOfDay.getDate() - i);

      const count = await prisma.apiRequestLog.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const label = startOfDay.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      dailyRequests.push({ label, count });
    }

    // Endpoint distribution
    // Group logs by endpoint
    const rawEndpoints = await prisma.apiRequestLog.groupBy({
      by: ['endpoint'],
      _count: {
        _all: true,
      },
    });

    const endpointDistribution = rawEndpoints.map(e => ({
      endpoint: e.endpoint,
      count: e._count._all,
    })).sort((a, b) => b.count - a.count);

    // Status code distribution
    const rawStatuses = await prisma.apiRequestLog.groupBy({
      by: ['statusCode'],
      _count: {
        _all: true,
      },
    });

    const statusDistribution = {
      success: 0, // 2xx
      clientError: 0, // 4xx
      serverError: 0, // 5xx
    };

    rawStatuses.forEach(s => {
      const code = s.statusCode;
      const count = s._count._all;
      if (code >= 200 && code < 300) {
        statusDistribution.success += count;
      } else if (code >= 400 && code < 500) {
        statusDistribution.clientError += count;
      } else if (code >= 500) {
        statusDistribution.serverError += count;
      }
    });

    // Developer leaderboard: List developers with project count, user count, request count
    const developersList = await prisma.developer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        isBlocked: true,
        projects: {
          select: {
            id: true,
            _count: {
              select: {
                endUsers: true,
                requestLogs: true,
              },
            },
          },
        },
      },
    });

    const leaderboard = developersList.map(dev => {
      const projectCount = dev.projects.length;
      const userCount = dev.projects.reduce((sum, p) => sum + p._count.endUsers, 0);
      const requestCount = dev.projects.reduce((sum, p) => sum + p._count.requestLogs, 0);

      return {
        id: dev.id,
        name: dev.name,
        email: dev.email,
        createdAt: dev.createdAt,
        isBlocked: dev.isBlocked,
        projectCount,
        userCount,
        requestCount,
      };
    }).sort((a, b) => b.userCount - a.userCount); // sort by user count

    res.json({
      success: true,
      data: {
        summary: {
          totalDevelopers,
          totalProjects,
          totalEndUsers,
          totalRequests,
          requests24h,
          avgUsersPerProject: totalProjects > 0 ? (totalEndUsers / totalProjects).toFixed(1) : 0,
        },
        dailyRequests,
        endpointDistribution,
        statusDistribution,
        leaderboard,
      },
    });
  } catch (err) {
    console.error('Get admin analytics error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/admin/developers/:id/reset-password
 * Reset a developer's password
 */
router.put('/developers/:id/reset-password', authAdmin, async (req, res) => {
  try {
    const { newPassword, generateAndEmail } = req.body;

    let finalPassword = newPassword;

    if (generateAndEmail) {
      finalPassword = generateStrongPassword();
    } else {
      if (!validateStrongPassword(finalPassword)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and exactly 1 @ symbol. No other special characters are allowed.',
        });
      }
    }

    const developer = await prisma.developer.findUnique({
      where: { id: req.params.id },
    });

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer not found.',
      });
    }

    const passwordHash = await bcrypt.hash(finalPassword, 12);

    await prisma.developer.update({
      where: { id: req.params.id },
      data: { passwordHash },
    });

    if (generateAndEmail) {
      try {
        await sendPasswordResetEmail(developer.email, finalPassword, 'AuthEasy Dashboard');
      } catch (err) {
        console.error('Failed to send reset email:', err);
        // Continue anyway, but maybe inform the client
      }
    }

    res.json({
      success: true,
      message: generateAndEmail 
        ? `A new password was generated and sent to ${developer.email}.` 
        : 'Developer password reset successfully.',
    });
  } catch (err) {
    console.error('Reset developer password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/admin/uis
 * List all pre-built UIs
 */
router.get('/uis', authAdmin, async (req, res) => {
  try {
    const uis = await prisma.prebuiltUi.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: uis });
  } catch (err) {
    console.error('List UIs error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/admin/uis
 * Add a new pre-built UI
 */
router.post('/uis', authAdmin, async (req, res) => {
  try {
    const { title, description, type, htmlCode, cssCode, jsCode, reactCode } = req.body;

    if (!title || !type) {
      return res.status(400).json({ success: false, message: 'Title and type are required.' });
    }

    const ui = await prisma.prebuiltUi.create({
      data: {
        title,
        description: description || '',
        type,
        htmlCode: htmlCode || '',
        cssCode: cssCode || '',
        jsCode: jsCode || '',
        reactCode: reactCode || '',
      },
    });

    res.status(201).json({ success: true, message: 'Pre-built UI added successfully.', data: ui });
  } catch (err) {
    console.error('Create UI error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/admin/uis/:id
 * Update an existing pre-built UI
 */
router.put('/uis/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, htmlCode, cssCode, jsCode, reactCode } = req.body;

    const ui = await prisma.prebuiltUi.findUnique({ where: { id } });
    if (!ui) {
      return res.status(404).json({ success: false, message: 'UI not found.' });
    }

    const updated = await prisma.prebuiltUi.update({
      where: { id },
      data: {
        title: title !== undefined ? title : ui.title,
        description: description !== undefined ? description : ui.description,
        type: type !== undefined ? type : ui.type,
        htmlCode: htmlCode !== undefined ? htmlCode : ui.htmlCode,
        cssCode: cssCode !== undefined ? cssCode : ui.cssCode,
        jsCode: jsCode !== undefined ? jsCode : ui.jsCode,
        reactCode: reactCode !== undefined ? reactCode : ui.reactCode,
      },
    });

    res.json({ success: true, message: 'Pre-built UI updated successfully.', data: updated });
  } catch (err) {
    console.error('Update UI error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * DELETE /api/admin/uis/:id
 * Delete a pre-built UI
 */
router.delete('/uis/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const ui = await prisma.prebuiltUi.findUnique({ where: { id } });
    if (!ui) {
      return res.status(404).json({ success: false, message: 'UI not found.' });
    }

    await prisma.prebuiltUi.delete({ where: { id } });

    res.json({ success: true, message: 'Pre-built UI deleted successfully.' });
  } catch (err) {
    console.error('Delete UI error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
