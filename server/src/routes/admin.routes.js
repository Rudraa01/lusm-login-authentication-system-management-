const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { validateStrongPassword, generateStrongPassword } = require('../utils/passwordUtil');
const { generateAccessToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/mailer');
const authAdmin = require('../middleware/authAdmin');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

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
    const [devCountRows] = await db.query('SELECT COUNT(*) AS count FROM Developer');
    const [projectCountRows] = await db.query('SELECT COUNT(*) AS count FROM Project');
    const [userCountRows] = await db.query('SELECT COUNT(*) AS count FROM EndUser');

    const totalDevelopers = devCountRows[0].count;
    const totalProjects = projectCountRows[0].count;
    const totalEndUsers = userCountRows[0].count;

    // Get projects with user count
    const [projectsWithUserCount] = await db.query(
      `SELECT id, name, (SELECT COUNT(*) FROM EndUser e WHERE e.projectId = p.id) AS userCount FROM Project p`
    );

    // Recent 5 developers signed up
    const [recentDevelopers] = await db.query(
      'SELECT id, name, email, isBlocked, createdAt FROM Developer ORDER BY createdAt DESC LIMIT 5'
    );

    res.json({
      success: true,
      data: {
        totalDevelopers,
        totalProjects,
        totalEndUsers,
        recentDevelopers,
        projectsWithUserCount: projectsWithUserCount
          .map(p => ({ id: p.id, name: p.name, userCount: p.userCount }))
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

    let sql = `
      SELECT id, name, email, isBlocked, createdAt,
             (SELECT COUNT(*) FROM Project p WHERE p.developerId = d.id) AS projectCount
      FROM Developer d
    `;
    let countSql = 'SELECT COUNT(*) AS count FROM Developer d';
    const params = [];
    const countParams = [];

    if (search) {
      const searchLike = `%${search}%`;
      sql += ' WHERE d.name LIKE ? OR d.email LIKE ?';
      countSql += ' WHERE d.name LIKE ? OR d.email LIKE ?';
      params.push(searchLike, searchLike);
      countParams.push(searchLike, searchLike);
    }

    sql += ' ORDER BY d.createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, skip);

    const [developers] = await db.query(sql, params);
    const [countRows] = await db.query(countSql, countParams);
    const total = countRows[0].count;

    res.json({
      success: true,
      data: {
        developers: developers.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          isBlocked: d.isBlocked,
          createdAt: d.createdAt,
          projectCount: d.projectCount,
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

    const [devRows] = await db.query('SELECT * FROM Developer WHERE id = ? LIMIT 1', [id]);
    const developer = devRows[0];

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer not found.',
      });
    }

    const [projects] = await db.query(
      `SELECT p.*, (SELECT COUNT(*) FROM EndUser e WHERE e.projectId = p.id) AS userCount
       FROM Project p
       WHERE p.developerId = ?`,
      [id]
    );

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
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          apiKey: p.apiKey,
          allowedOrigins: p.allowedOrigins,
          createdAt: p.createdAt,
          userCount: p.userCount,
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

    const [devRows] = await db.query('SELECT * FROM Developer WHERE id = ? LIMIT 1', [id]);
    const developer = devRows[0];
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer not found.',
      });
    }

    await db.query('UPDATE Developer SET isBlocked = ? WHERE id = ?', [isBlocked, id]);

    const [updatedRows] = await db.query(
      'SELECT id, name, email, isBlocked FROM Developer WHERE id = ? LIMIT 1',
      [id]
    );
    const updated = updatedRows[0];

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

    const [devRows] = await db.query('SELECT * FROM Developer WHERE id = ? LIMIT 1', [id]);
    const developer = devRows[0];
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer not found.',
      });
    }

    await db.query('DELETE FROM Developer WHERE id = ?', [id]);

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
    const [devCountRows] = await db.query('SELECT COUNT(*) AS count FROM Developer');
    const [projectCountRows] = await db.query('SELECT COUNT(*) AS count FROM Project');
    const [userCountRows] = await db.query('SELECT COUNT(*) AS count FROM EndUser');
    const [reqCountRows] = await db.query('SELECT COUNT(*) AS count FROM ApiRequestLog');

    const totalDevelopers = devCountRows[0].count;
    const totalProjects = projectCountRows[0].count;
    const totalEndUsers = userCountRows[0].count;
    const totalRequests = reqCountRows[0].count;

    // Requests in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [req24Rows] = await db.query(
      'SELECT COUNT(*) AS count FROM ApiRequestLog WHERE createdAt >= ?',
      [oneDayAgo]
    );
    const requests24h = req24Rows[0].count;

    // Request counts for the past 7 days (trend line)
    const dailyRequests = [];
    for (let i = 6; i >= 0; i--) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      startOfDay.setDate(startOfDay.getDate() - i);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      endOfDay.setDate(endOfDay.getDate() - i);

      const [countRows] = await db.query(
        'SELECT COUNT(*) AS count FROM ApiRequestLog WHERE createdAt >= ? AND createdAt <= ?',
        [startOfDay, endOfDay]
      );

      const label = startOfDay.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
      dailyRequests.push({ label, count: countRows[0].count });
    }

    // Endpoint distribution
    const [endpointDistribution] = await db.query(
      'SELECT endpoint, COUNT(*) AS count FROM ApiRequestLog GROUP BY endpoint ORDER BY count DESC'
    );

    // Status code distribution
    const [rawStatuses] = await db.query(
      'SELECT statusCode, COUNT(*) AS count FROM ApiRequestLog GROUP BY statusCode'
    );

    const statusDistribution = {
      success: 0, // 2xx
      clientError: 0, // 4xx
      serverError: 0, // 5xx
    };

    rawStatuses.forEach(s => {
      const code = s.statusCode;
      const count = s.count;
      if (code >= 200 && code < 300) {
        statusDistribution.success += count;
      } else if (code >= 400 && code < 500) {
        statusDistribution.clientError += count;
      } else if (code >= 500) {
        statusDistribution.serverError += count;
      }
    });

    // Developer leaderboard
    const [leaderboard] = await db.query(
      `SELECT 
        d.id, 
        d.name, 
        d.email, 
        d.createdAt, 
        d.isBlocked,
        (SELECT COUNT(*) FROM Project p WHERE p.developerId = d.id) AS projectCount,
        (SELECT COUNT(*) FROM EndUser e JOIN Project p ON e.projectId = p.id WHERE p.developerId = d.id) AS userCount,
        (SELECT COUNT(*) FROM ApiRequestLog r JOIN Project p ON r.projectId = p.id WHERE p.developerId = d.id) AS requestCount
      FROM Developer d
      ORDER BY userCount DESC`
    );

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

    const [devRows] = await db.query('SELECT * FROM Developer WHERE id = ? LIMIT 1', [req.params.id]);
    const developer = devRows[0];

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer not found.',
      });
    }

    const passwordHash = await bcrypt.hash(finalPassword, 12);

    await db.query('UPDATE Developer SET passwordHash = ? WHERE id = ?', [passwordHash, req.params.id]);

    if (generateAndEmail) {
      try {
        await sendPasswordResetEmail(developer.email, finalPassword, 'AuthEasy Dashboard');
      } catch (err) {
        console.error('Failed to send reset email:', err);
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
    const [uis] = await db.query('SELECT * FROM PrebuiltUi ORDER BY createdAt DESC');
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

    const uiId = uuidv4();
    const createdAt = new Date();

    await db.query(
      `INSERT INTO PrebuiltUi (id, title, description, type, htmlCode, cssCode, jsCode, reactCode, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uiId,
        title,
        description || '',
        type,
        htmlCode || '',
        cssCode || '',
        jsCode || '',
        reactCode || '',
        createdAt,
        createdAt,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Pre-built UI added successfully.',
      data: {
        id: uiId,
        title,
        description: description || '',
        type,
        htmlCode: htmlCode || '',
        cssCode: cssCode || '',
        jsCode: jsCode || '',
        reactCode: reactCode || '',
        createdAt,
        updatedAt: createdAt,
      }
    });
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

    const [uiRows] = await db.query('SELECT * FROM PrebuiltUi WHERE id = ? LIMIT 1', [id]);
    const ui = uiRows[0];
    if (!ui) {
      return res.status(404).json({ success: false, message: 'UI not found.' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (htmlCode !== undefined) updateData.htmlCode = htmlCode;
    if (cssCode !== undefined) updateData.cssCode = cssCode;
    if (jsCode !== undefined) updateData.jsCode = jsCode;
    if (reactCode !== undefined) updateData.reactCode = reactCode;

    if (Object.keys(updateData).length > 0) {
      const fields = [];
      const values = [];
      for (const [key, val] of Object.entries(updateData)) {
        fields.push(`\`${key}\` = ?`);
        values.push(val);
      }
      values.push(id);

      await db.query(
        `UPDATE PrebuiltUi SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [updatedRows] = await db.query('SELECT * FROM PrebuiltUi WHERE id = ? LIMIT 1', [id]);
    const updated = updatedRows[0];

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

    const [uiRows] = await db.query('SELECT * FROM PrebuiltUi WHERE id = ? LIMIT 1', [id]);
    const ui = uiRows[0];
    if (!ui) {
      return res.status(404).json({ success: false, message: 'UI not found.' });
    }

    await db.query('DELETE FROM PrebuiltUi WHERE id = ?', [id]);

    res.json({ success: true, message: 'Pre-built UI deleted successfully.' });
  } catch (err) {
    console.error('Delete UI error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
