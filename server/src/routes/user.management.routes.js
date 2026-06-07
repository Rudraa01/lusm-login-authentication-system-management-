const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../utils/db');
const { validateStrongPassword, generateStrongPassword } = require('../utils/passwordUtil');
const { sendPasswordResetEmail } = require('../utils/mailer');
const authDeveloper = require('../middleware/authDeveloper');

const router = express.Router();

/**
 * GET /api/dash/projects/:id/users
 * List all end-users of a project with pagination
 */
router.get('/:id/users', authDeveloper, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify project ownership
    const [projRows] = await db.query(
      'SELECT id FROM Project WHERE id = ? AND developerId = ? LIMIT 1',
      [req.params.id, req.developer.id]
    );

    if (projRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    let sql = 'SELECT id, email, name, avatarUrl, isVerified, isBlocked, createdAt FROM EndUser WHERE projectId = ?';
    let countSql = 'SELECT COUNT(*) AS count FROM EndUser WHERE projectId = ?';
    const params = [req.params.id];
    const countParams = [req.params.id];

    if (search) {
      const searchLike = `%${search}%`;
      sql += ' AND (email LIKE ? OR name LIKE ?)';
      countSql += ' AND (email LIKE ? OR name LIKE ?)';
      params.push(searchLike, searchLike);
      countParams.push(searchLike, searchLike);
    }

    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), skip);

    const [users] = await db.query(sql, params);
    const [countRows] = await db.query(countSql, countParams);
    const total = countRows[0].count;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PATCH /api/dash/projects/:id/users/:userId/block
 * Block or unblock an end-user
 */
router.patch('/:id/users/:userId/block', authDeveloper, async (req, res) => {
  try {
    const { isBlocked } = req.body;

    // Verify project ownership
    const [projRows] = await db.query(
      'SELECT id FROM Project WHERE id = ? AND developerId = ? LIMIT 1',
      [req.params.id, req.developer.id]
    );

    if (projRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Find the user in this project
    const [userRows] = await db.query(
      'SELECT * FROM EndUser WHERE id = ? AND projectId = ? LIMIT 1',
      [req.params.userId, req.params.id]
    );
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this project.',
      });
    }

    const nextBlocked = isBlocked !== undefined ? isBlocked : !user.isBlocked;

    await db.query(
      'UPDATE EndUser SET isBlocked = ? WHERE id = ?',
      [nextBlocked, req.params.userId]
    );

    const [updatedRows] = await db.query(
      'SELECT id, email, isBlocked FROM EndUser WHERE id = ? LIMIT 1',
      [req.params.userId]
    );
    const updated = updatedRows[0];

    res.json({
      success: true,
      message: updated.isBlocked
        ? 'User has been blocked.'
        : 'User has been unblocked.',
      data: updated,
    });
  } catch (err) {
    console.error('Block user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * DELETE /api/dash/projects/:id/users/:userId
 * Delete an end-user from a project
 */
router.delete('/:id/users/:userId', authDeveloper, async (req, res) => {
  try {
    // Verify project ownership
    const [projRows] = await db.query(
      'SELECT id FROM Project WHERE id = ? AND developerId = ? LIMIT 1',
      [req.params.id, req.developer.id]
    );

    if (projRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const [userRows] = await db.query(
      'SELECT id FROM EndUser WHERE id = ? AND projectId = ? LIMIT 1',
      [req.params.userId, req.params.id]
    );
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this project.',
      });
    }

    await db.query('DELETE FROM EndUser WHERE id = ?', [req.params.userId]);

    res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/dash/projects/:id/users/:userId/reset-password
 * Reset an end-user's password
 */
router.put('/:id/users/:userId/reset-password', authDeveloper, async (req, res) => {
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

    // Verify project ownership
    const [projRows] = await db.query(
      'SELECT id, name, logoUrl FROM Project WHERE id = ? AND developerId = ? LIMIT 1',
      [req.params.id, req.developer.id]
    );
    const project = projRows[0];

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const [userRows] = await db.query(
      'SELECT id, email FROM EndUser WHERE id = ? AND projectId = ? LIMIT 1',
      [req.params.userId, req.params.id]
    );
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this project.',
      });
    }

    const passwordHash = await bcrypt.hash(finalPassword, 12);

    await db.query(
      'UPDATE EndUser SET passwordHash = ? WHERE id = ?',
      [passwordHash, req.params.userId]
    );

    if (generateAndEmail) {
      try {
        await sendPasswordResetEmail(user.email, finalPassword, project.name, project.logoUrl);
      } catch (err) {
        console.error('Failed to send reset email:', err);
      }
    }

    res.json({
      success: true,
      message: generateAndEmail
        ? `A new password was generated and sent to ${user.email}.`
        : 'User password reset successfully.',
    });
  } catch (err) {
    console.error('Reset user password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
