const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { validateStrongPassword } = require('../utils/passwordUtil');
const { generateOtp, getOtpExpiry } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');
const authDeveloper = require('../middleware/authDeveloper');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/dash/signup
 * Register a new developer (sends OTP, doesn't return JWT)
 */
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (!validateStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and exactly 1 @ symbol. No other special characters are allowed.',
      });
    }

    // Check if developer already exists
    const existing = await prisma.developer.findUnique({ where: { email } });
    
    if (existing) {
      if (existing.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'A developer with this email already exists.',
        });
      }
      
      // Update existing unverified developer
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.developer.update({
        where: { id: existing.id },
        data: { name, passwordHash }
      });
      
      const otpCode = generateOtp();
      await prisma.otp.create({
        data: {
          code: otpCode,
          type: 'SIGNUP',
          expiresAt: getOtpExpiry(),
          developerId: existing.id,
        },
      });

      try {
        await sendOtpEmail(email, otpCode, 'SIGNUP', 'AuthEasy Developer Portal');
      } catch (emailErr) {
        console.error('Failed to send OTP email:', emailErr);
      }

      return res.status(200).json({
        success: true,
        message: 'Developer account already exists but is unverified. A new verification OTP has been sent.',
        data: { developer: { id: existing.id, name, email } }
      });
    }

    // Hash password and create developer
    const passwordHash = await bcrypt.hash(password, 12);
    const developer = await prisma.developer.create({
      data: { name, email, passwordHash },
    });

    // Generate and save OTP
    const otpCode = generateOtp();
    await prisma.otp.create({
      data: {
        code: otpCode,
        type: 'SIGNUP',
        expiresAt: getOtpExpiry(),
        developerId: developer.id,
      },
    });

    // Send OTP email
    try {
      await sendOtpEmail(email, otpCode, 'SIGNUP', 'AuthEasy Developer Portal');
    } catch (emailErr) {
      console.error('Failed to send developer OTP email:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent.',
      data: {
        developer: {
          id: developer.id,
          name: developer.name,
          email: developer.email,
          createdAt: developer.createdAt,
        }
      },
    });
  } catch (err) {
    console.error('Developer signup error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/dash/verify-otp
 * Verify developer signup OTP
 */
router.post('/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const developer = await prisma.developer.findUnique({ where: { email } });
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer account not found.',
      });
    }

    if (developer.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified.',
      });
    }

    // Find valid OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        developerId: developer.id,
        code: otp,
        type: 'SIGNUP',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Mark OTP as used and verify developer
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    await prisma.developer.update({
      where: { id: developer.id },
      data: { isVerified: true },
    });

    // Generate token
    const accessToken = generateAccessToken({
      id: developer.id,
      email: developer.email,
      role: 'developer',
    });

    res.json({
      success: true,
      message: 'Email verified successfully.',
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
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/dash/resend-otp
 * Resend OTP code for developer signup
 */
router.post('/resend-otp', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const developer = await prisma.developer.findUnique({ where: { email } });
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer account not found.',
      });
    }

    if (developer.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified.',
      });
    }

    const otpCode = generateOtp();
    await prisma.otp.create({
      data: {
        code: otpCode,
        type: 'SIGNUP',
        expiresAt: getOtpExpiry(),
        developerId: developer.id,
      },
    });

    try {
      await sendOtpEmail(email, otpCode, 'SIGNUP', 'AuthEasy Developer Portal');
    } catch (emailErr) {
      console.error('Failed to resend developer OTP email:', emailErr);
    }

    res.json({
      success: true,
      message: 'OTP has been resent to your email.',
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
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

    if (!developer.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify your email first.',
        unverified: true,
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

      if (!validateStrongPassword(newPassword)) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and exactly 1 @ symbol. No other special characters are allowed.',
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
