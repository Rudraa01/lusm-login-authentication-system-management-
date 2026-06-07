const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { validateApiKey, authEndUser } = require('../middleware/validateApiKey');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOtp, getOtpExpiry } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');
const { validateStrongPassword } = require('../utils/passwordUtil');

const router = express.Router();

// All public auth routes require a valid API key
router.use(validateApiKey);

/**
 * POST /api/v1/auth/register
 * Register a new end-user and send OTP email
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    if (!validateStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and exactly 1 @ symbol. No other special characters are allowed.',
      });
    }

    // Check if user already exists in this project by email
    const [emailRows] = await db.query(
      'SELECT * FROM EndUser WHERE email = ? AND projectId = ? LIMIT 1',
      [email, req.project.id]
    );
    let existing = emailRows[0];

    // Check by phone if provided
    if (!existing && phone) {
      const [phoneRows] = await db.query(
        'SELECT * FROM EndUser WHERE phone = ? AND projectId = ? LIMIT 1',
        [phone, req.project.id]
      );
      existing = phoneRows[0];
    }

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
      await db.query(
        'UPDATE EndUser SET passwordHash = ?, name = ?, phone = ?, updatedAt = NOW(3) WHERE id = ?',
        [passwordHash, name || '', phone || existing.phone, existing.id]
      );
      const [userRows] = await db.query('SELECT * FROM EndUser WHERE id = ? LIMIT 1', [existing.id]);
      user = userRows[0];
    } else {
      // Create new user
      const userId = uuidv4();
      const createdAt = new Date();
      await db.query(
        `INSERT INTO EndUser (id, email, phone, passwordHash, name, projectId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, phone || null, passwordHash, name || '', req.project.id, createdAt, createdAt]
      );
      const [userRows] = await db.query('SELECT * FROM EndUser WHERE id = ? LIMIT 1', [userId]);
      user = userRows[0];
    }

    // Generate and save OTP
    const otpCode = generateOtp();
    await db.query(
      'INSERT INTO Otp (id, code, type, expiresAt, endUserId) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), otpCode, 'SIGNUP', getOtpExpiry(), user.id]
    );

    // Send OTP email
    try {
      await sendOtpEmail(email, otpCode, 'SIGNUP', req.project.name, req.project.logoUrl);
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr);
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
        message: 'Email/Phone and OTP are required.',
      });
    }

    const [emailRows] = await db.query(
      'SELECT * FROM EndUser WHERE email = ? AND projectId = ? LIMIT 1',
      [email, req.project.id]
    );
    let user = emailRows[0];

    if (!user) {
      // Try by phone
      const [phoneRows] = await db.query(
        'SELECT * FROM EndUser WHERE phone = ? AND projectId = ? LIMIT 1',
        [email, req.project.id]
      );
      user = phoneRows[0];
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Find valid OTP
    const [otpRows] = await db.query(
      `SELECT * FROM Otp 
       WHERE endUserId = ? AND code = ? AND type = 'SIGNUP' AND usedAt IS NULL AND expiresAt > ? 
       ORDER BY createdAt DESC LIMIT 1`,
      [user.id, otp, new Date()]
    );
    const otpRecord = otpRows[0];

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Mark OTP as used and verify user
    await db.query('UPDATE Otp SET usedAt = ? WHERE id = ?', [new Date(), otpRecord.id]);
    await db.query('UPDATE EndUser SET isVerified = 1 WHERE id = ?', [user.id]);

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      projectId: req.project.id,
      role: 'enduser',
    });

    const refreshTokenValue = uuidv4();
    await db.query(
      'INSERT INTO RefreshToken (id, token, expiresAt, endUserId) VALUES (?, ?, ?, ?)',
      [uuidv4(), refreshTokenValue, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), user.id]
    );

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
        message: 'Email/Phone and password are required.',
      });
    }

    const [emailRows] = await db.query(
      'SELECT * FROM EndUser WHERE email = ? AND projectId = ? LIMIT 1',
      [email, req.project.id]
    );
    let user = emailRows[0];

    if (!user) {
      // Try by phone
      const [phoneRows] = await db.query(
        'SELECT * FROM EndUser WHERE phone = ? AND projectId = ? LIMIT 1',
        [email, req.project.id]
      );
      user = phoneRows[0];
    }

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
    await db.query(
      'INSERT INTO RefreshToken (id, token, expiresAt, endUserId) VALUES (?, ?, ?, ?)',
      [uuidv4(), refreshTokenValue, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), user.id]
    );

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
        message: 'Email or phone is required.',
      });
    }

    const [emailRows] = await db.query(
      'SELECT * FROM EndUser WHERE email = ? AND projectId = ? LIMIT 1',
      [email, req.project.id]
    );
    let user = emailRows[0];

    if (!user) {
      // Try by phone
      const [phoneRows] = await db.query(
        'SELECT * FROM EndUser WHERE phone = ? AND projectId = ? LIMIT 1',
        [email, req.project.id]
      );
      user = phoneRows[0];
    }

    // Don't reveal if user exists or not
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent.',
      });
    }

    const otpCode = generateOtp();
    await db.query(
      'INSERT INTO Otp (id, code, type, expiresAt, endUserId) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), otpCode, 'RESET', getOtpExpiry(), user.id]
    );

    try {
      // Always send OTP to user.email even if phone was provided
      await sendOtpEmail(user.email, otpCode, 'RESET', req.project.name, req.project.logoUrl);
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

    if (!validateStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and exactly 1 @ symbol. No other special characters are allowed.',
      });
    }

    const [emailRows] = await db.query(
      'SELECT * FROM EndUser WHERE email = ? AND projectId = ? LIMIT 1',
      [email, req.project.id]
    );
    let user = emailRows[0];

    if (!user) {
      // Try by phone
      const [phoneRows] = await db.query(
        'SELECT * FROM EndUser WHERE phone = ? AND projectId = ? LIMIT 1',
        [email, req.project.id]
      );
      user = phoneRows[0];
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Find valid reset OTP
    const [otpRows] = await db.query(
      `SELECT * FROM Otp 
       WHERE endUserId = ? AND code = ? AND type = 'RESET' AND usedAt IS NULL AND expiresAt > ? 
       ORDER BY createdAt DESC LIMIT 1`,
      [user.id, otp, new Date()]
    );
    const otpRecord = otpRows[0];

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Mark OTP as used and update password
    await db.query('UPDATE Otp SET usedAt = ? WHERE id = ?', [new Date(), otpRecord.id]);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE EndUser SET passwordHash = ? WHERE id = ?', [passwordHash, user.id]);

    // Invalidate all refresh tokens for this user
    await db.query('DELETE FROM RefreshToken WHERE endUserId = ?', [user.id]);

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

    const [tokenRows] = await db.query(
      `SELECT r.*, e.id AS userId, e.email AS userEmail, e.projectId AS userProjectId, e.isBlocked AS userIsBlocked
       FROM RefreshToken r
       JOIN EndUser e ON r.endUserId = e.id
       WHERE r.token = ? LIMIT 1`,
      [refreshToken]
    );
    const tokenRecord = tokenRows[0];

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    if (tokenRecord.userIsBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked.',
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: tokenRecord.userId,
      email: tokenRecord.userEmail,
      projectId: tokenRecord.userProjectId,
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
    const [userRows] = await db.query(
      'SELECT id, email, name, avatarUrl, isVerified, createdAt FROM EndUser WHERE id = ? LIMIT 1',
      [req.endUser.id]
    );
    const user = userRows[0];

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

    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(updateData)) {
      fields.push(`\`${key}\` = ?`);
      values.push(val);
    }
    values.push(req.endUser.id);

    await db.query(
      `UPDATE EndUser SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedRows] = await db.query(
      'SELECT id, email, name, avatarUrl, isVerified FROM EndUser WHERE id = ? LIMIT 1',
      [req.endUser.id]
    );
    const updated = updatedRows[0];

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
        message: 'Email/Phone is required.',
      });
    }

    const [emailRows] = await db.query(
      'SELECT * FROM EndUser WHERE email = ? AND projectId = ? LIMIT 1',
      [email, req.project.id]
    );
    let user = emailRows[0];

    if (!user) {
      const [phoneRows] = await db.query(
        'SELECT * FROM EndUser WHERE phone = ? AND projectId = ? LIMIT 1',
        [email, req.project.id]
      );
      user = phoneRows[0];
    }

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
    await db.query(
      'INSERT INTO Otp (id, code, type, expiresAt, endUserId) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), otpCode, 'SIGNUP', getOtpExpiry(), user.id]
    );

    try {
      await sendOtpEmail(user.email, otpCode, 'SIGNUP', req.project.name, req.project.logoUrl);
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
