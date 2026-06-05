const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const authDeveloper = require('../middleware/authDeveloper');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/dash/signup
 * Register a new developer
 */
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Check if developer already exists
    const existing = await prisma.developer.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A developer with this email already exists.',
      });
    }

    // Hash password and create developer
    const passwordHash = await bcrypt.hash(password, 12);
    const developer = await prisma.developer.create({
      data: { name, email, passwordHash },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: developer.id,
      email: developer.email,
      role: 'developer',
    });

    res.status(201).json({
      success: true,
      message: 'Developer registered successfully.',
      data: {
        developer: {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          createdAt: developer.createdAt,
        },
        accessToken,
      },
    });
  } catch (err) {
    console.error('Developer signup error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/dash/login
 * Developer login
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

    const developer = await prisma.developer.findUnique({ where: { email } });
    if (!developer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (developer.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your developer account has been blocked. Please contact support.',
      });
    }

    const isMatch = await bcrypt.compare(password, developer.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const accessToken = generateAccessToken({
      id: developer.id,
      email: developer.email,
      role: 'developer',
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        developer: {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          createdAt: developer.createdAt,
        },
        accessToken,
      },
    });
  } catch (err) {
    console.error('Developer login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/dash/me
 * Get current developer profile
 */
router.get('/me', authDeveloper, async (req, res) => {
  try {
    const developer = await prisma.developer.findUnique({
      where: { id: req.developer.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { projects: true } },
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
        ...developer,
        projectCount: developer._count.projects,
      },
    });
  } catch (err) {
    console.error('Get developer error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/dash/me
 * Update developer profile
 */
router.put('/me', authDeveloper, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const updateData = {};

    if (name) updateData.name = name;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }

      const developer = await prisma.developer.findUnique({
        where: { id: req.developer.id },
      });

      const isMatch = await bcrypt.compare(
        currentPassword,
        developer.passwordHash
      );
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters.',
        });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }

    const updated = await prisma.developer.update({
      where: { id: req.developer.id },
      data: updateData,
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (err) {
    console.error('Update developer error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
