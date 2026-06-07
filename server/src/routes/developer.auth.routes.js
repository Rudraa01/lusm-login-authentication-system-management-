const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { validateStrongPassword } = require('../utils/passwordUtil');
const { generateOtp, getOtpExpiry } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');
const authDeveloper = require('../middleware/authDeveloper');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

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
    const [existingRows] = await db.query('SELECT * FROM Developer WHERE email = ? LIMIT 1', [email]);
    const existing = existingRows[0];
    
    if (existing) {
      if (existing.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'A developer with this email already exists.',
        });
      }
      
      // Update existing unverified developer
      const passwordHash = await bcrypt.hash(password, 12);
      await db.query(
        'UPDATE Developer SET name = ?, passwordHash = ? WHERE id = ?',
        [name, passwordHash, existing.id]
      );
      
      const otpCode = generateOtp();
      await db.query(
        'INSERT INTO Otp (id, code, type, expiresAt, developerId) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), otpCode, 'SIGNUP', getOtpExpiry(), existing.id]
      );

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
    const developerId = uuidv4();
    const createdAt = new Date();
    await db.query(
      'INSERT INTO Developer (id, name, email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [developerId, name, email, passwordHash, createdAt, createdAt]
    );

    // Generate and save OTP
    const otpCode = generateOtp();
    await db.query(
      'INSERT INTO Otp (id, code, type, expiresAt, developerId) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), otpCode, 'SIGNUP', getOtpExpiry(), developerId]
    );

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
          id: developerId,
          name,
          email,
          createdAt,
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

    const [devRows] = await db.query('SELECT * FROM Developer WHERE email = ? LIMIT 1', [email]);
    const developer = devRows[0];
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
    const [otpRows] = await db.query(
      `SELECT * FROM Otp 
       WHERE developerId = ? AND code = ? AND type = 'SIGNUP' AND usedAt IS NULL AND expiresAt > ? 
       ORDER BY createdAt DESC LIMIT 1`,
      [developer.id, otp, new Date()]
    );
    const otpRecord = otpRows[0];

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Mark OTP as used and verify developer
    await db.query('UPDATE Otp SET usedAt = ? WHERE id = ?', [new Date(), otpRecord.id]);
    await db.query('UPDATE Developer SET isVerified = 1 WHERE id = ?', [developer.id]);

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

    const [devRows] = await db.query('SELECT * FROM Developer WHERE email = ? LIMIT 1', [email]);
    const developer = devRows[0];
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
    await db.query(
      'INSERT INTO Otp (id, code, type, expiresAt, developerId) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), otpCode, 'SIGNUP', getOtpExpiry(), developer.id]
    );

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

    const [devRows] = await db.query('SELECT * FROM Developer WHERE email = ? LIMIT 1', [email]);
    const developer = devRows[0];
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
    const [devRows] = await db.query(
      'SELECT id, name, email, createdAt FROM Developer WHERE id = ? LIMIT 1',
      [req.developer.id]
    );
    const developer = devRows[0];

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'Developer not found.',
      });
    }

    const [projectRows] = await db.query(
      'SELECT COUNT(*) AS projectCount FROM Project WHERE developerId = ?',
      [req.developer.id]
    );

    res.json({
      success: true,
      data: {
        id: developer.id,
        name: developer.name,
        email: developer.email,
        createdAt: developer.createdAt,
        projectCount: projectRows[0].projectCount,
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

      const [devRows] = await db.query(
        'SELECT passwordHash FROM Developer WHERE id = ? LIMIT 1',
        [req.developer.id]
      );
      const developer = devRows[0];

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

    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(updateData)) {
      fields.push(`\`${key}\` = ?`);
      values.push(val);
    }
    values.push(req.developer.id);

    await db.query(
      `UPDATE Developer SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedRows] = await db.query(
      'SELECT id, name, email, createdAt FROM Developer WHERE id = ? LIMIT 1',
      [req.developer.id]
    );
    const updated = updatedRows[0];

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
