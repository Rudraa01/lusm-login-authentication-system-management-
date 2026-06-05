const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const { validateApiKey, authEndUser } = require('../middleware/validateApiKey');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOtp, getOtpExpiry } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');

const router = express.Router();
const prisma = new PrismaClient();

// All public auth routes require a valid API key
router.use(validateApiKey);

/**
 * POST /api/v1/auth/register
 * Register a new end-user and send OTP email
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Check if user already exists in this project
    const existing = await prisma.endUser.findUnique({
      where: {
        email_projectId: {
          email,
          projectId: req.project.id,
        },
      },
    });

    if (existing && existing.isVerified) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    if (existing && !existing.isVerified) {
      // Update existing unverified user
      user = await prisma.endUser.update({
        where: { id: existing.id },
        data: { passwordHash, name: name || '' },
      });
    } else {
      // Create new user
      user = await prisma.endUser.create({
        data: {
          email,
          passwordHash,
          name: name || '',
          projectId: req.project.id,
        },
      });
    }

    // Generate and save OTP
    const otpCode = generateOtp();
    await prisma.otp.create({
      data: {
        code: otpCode,
        type: 'SIGNUP',
        expiresAt: getOtpExpiry(),
        endUserId: user.id,
      },
    });

    // Send OTP email
    try {
      await sendOtpEmail(email, otpCode, 'SIGNUP', req.project.name);
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr);
      // Don't fail the request, just log it. In dev, OTP is logged to console.
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent.',
      data: {
        userId: user.id,
        email: user.email,
        isVerified: false,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP to activate user account
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

    const user = await prisma.endUser.findUnique({
      where: {
        email_projectId: {
          email,
          projectId: req.project.id,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Find valid OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        endUserId: user.id,
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

    // Mark OTP as used and verify user
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    await prisma.endUser.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      projectId: req.project.id,
      role: 'enduser',
    });

    const refreshTokenValue = uuidv4();
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        endUserId: user.id,
      },
    });

    res.json({
      success: true,
      message: 'Email verified successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: true,
        },
        accessToken,
        refreshToken: refreshTokenValue,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/v1/auth/login
 * Login an end-user
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

    const user = await prisma.endUser.findUnique({
      where: {
        email_projectId: {
          email,
          projectId: req.project.id,
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify your email first.',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Contact the app administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      projectId: req.project.id,
      role: 'enduser',
    });

    const refreshTokenValue = uuidv4();
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endUserId: user.id,
      },
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken: refreshTokenValue,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Send password reset OTP
 */
router.post('/forgot-password', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await prisma.endUser.findUnique({
      where: {
        email_projectId: {
          email,
          projectId: req.project.id,
        },
      },
    });

    // Don't reveal if user exists or not
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent.',
      });
    }

    const otpCode = generateOtp();
    await prisma.otp.create({
      data: {
        code: otpCode,
        type: 'RESET',
        expiresAt: getOtpExpiry(),
        endUserId: user.id,
      },
    });

    try {
      await sendOtpEmail(email, otpCode, 'RESET', req.project.name);
    } catch (emailErr) {
      console.error('Failed to send reset OTP email:', emailErr);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, an OTP has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Reset password using OTP
 */
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const user = await prisma.endUser.findUnique({
      where: {
        email_projectId: {
          email,
          projectId: req.project.id,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Find valid reset OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        endUserId: user.id,
        code: otp,
        type: 'RESET',
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

    // Mark OTP as used and update password
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.endUser.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { endUserId: user.id },
    });

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/v1/auth/refresh-token
 * Get new access token using refresh token
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { endUser: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    if (tokenRecord.endUser.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked.',
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: tokenRecord.endUser.id,
      email: tokenRecord.endUser.email,
      projectId: tokenRecord.endUser.projectId,
      role: 'enduser',
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current end-user profile (requires API key + user token)
 */
router.get('/me', authEndUser, async (req, res) => {
  try {
    const user = await prisma.endUser.findUnique({
      where: { id: req.endUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/v1/auth/me
 * Update end-user profile
 */
router.put('/me', authEndUser, async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.',
      });
    }

    const updated = await prisma.endUser.update({
      where: { id: req.endUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isVerified: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/v1/auth/resend-otp
 * Resend OTP for signup verification
 */
router.post('/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await prisma.endUser.findUnique({
      where: {
        email_projectId: {
          email,
          projectId: req.project.id,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified.',
      });
    }

    const otpCode = generateOtp();
    await prisma.otp.create({
      data: {
        code: otpCode,
        type: 'SIGNUP',
        expiresAt: getOtpExpiry(),
        endUserId: user.id,
      },
    });

    try {
      await sendOtpEmail(email, otpCode, 'SIGNUP', req.project.name);
    } catch (emailErr) {
      console.error('Failed to resend OTP email:', emailErr);
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

module.exports = router;
