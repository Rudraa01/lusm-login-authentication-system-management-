const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validateStrongPassword, generateStrongPassword } = require('../utils/passwordUtil');
const { sendPasswordResetEmail } = require('../utils/mailer');
const authDeveloper = require('../middleware/authDeveloper');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/dash/projects/:id/users
 * List all end-users of a project with pagination
 */
router.get('/:id/users', authDeveloper, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, developerId: req.developer.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const where = {
      projectId: req.params.id,
      ...(search
        ? {
            OR: [
              { email: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.endUser.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isVerified: true,
          isBlocked: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.endUser.count({ where }),
    ]);

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
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, developerId: req.developer.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    // Find the user in this project
    const user = await prisma.endUser.findFirst({
      where: { id: req.params.userId, projectId: req.params.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this project.',
      });
    }

    const updated = await prisma.endUser.update({
      where: { id: req.params.userId },
      data: { isBlocked: isBlocked !== undefined ? isBlocked : !user.isBlocked },
      select: { id: true, email: true, isBlocked: true },
    });

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
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, developerId: req.developer.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const user = await prisma.endUser.findFirst({
      where: { id: req.params.userId, projectId: req.params.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this project.',
      });
    }

    await prisma.endUser.delete({ where: { id: req.params.userId } });

    res.json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (err) {
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
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, developerId: req.developer.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const user = await prisma.endUser.findFirst({
      where: { id: req.params.userId, projectId: req.params.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this project.',
      });
    }

    const passwordHash = await bcrypt.hash(finalPassword, 12);

    await prisma.endUser.update({
      where: { id: req.params.userId },
      data: { passwordHash },
    });

    if (generateAndEmail) {
      try {
        await sendPasswordResetEmail(user.email, finalPassword, project.name);
      } catch (err) {
        console.error('Failed to send reset email:', err);
        // Continue anyway
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
