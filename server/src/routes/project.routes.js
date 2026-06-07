const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const authDeveloper = require('../middleware/authDeveloper');

const router = express.Router();

/**
 * Generate a unique API key in the format: autheasy_xxxx_xxxx_xxxx
 */
const generateApiKey = () => {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    segments.push(
      uuidv4().replace(/-/g, '').substring(0, 8)
    );
  }
  return `autheasy_${segments.join('_')}`;
};

/**
 * POST /api/dash/projects
 * Create a new project
 */
router.post('/', authDeveloper, async (req, res) => {
  try {
    const { name, description, allowedOrigins, logoUrl } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required.',
      });
    }

    // Check project limit (max 10 projects per developer for free tier)
    const [countRows] = await db.query(
      'SELECT COUNT(*) AS count FROM Project WHERE developerId = ?',
      [req.developer.id]
    );
    const projectCount = countRows[0].count;

    if (projectCount >= 10) {
      return res.status(403).json({
        success: false,
        message: 'Maximum project limit (10) reached.',
      });
    }

    const apiKey = generateApiKey();
    const projectId = uuidv4();
    const createdAt = new Date();

    await db.query(
      `INSERT INTO Project (id, name, description, logoUrl, apiKey, allowedOrigins, developerId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        name.trim(),
        description || '',
        logoUrl || '',
        apiKey,
        allowedOrigins || '',
        req.developer.id,
        createdAt,
        createdAt,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: {
        id: projectId,
        name: name.trim(),
        description: description || '',
        logoUrl: logoUrl || '',
        apiKey,
        allowedOrigins: allowedOrigins || '',
        createdAt,
      },
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/dash/projects
 * List all projects for the authenticated developer
 */
router.get('/', authDeveloper, async (req, res) => {
  try {
    const [projects] = await db.query(
      `SELECT p.*, (SELECT COUNT(*) FROM EndUser e WHERE e.projectId = p.id) AS userCount
       FROM Project p
       WHERE p.developerId = ?
       ORDER BY p.createdAt DESC`,
      [req.developer.id]
    );

    const data = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      logoUrl: p.logoUrl,
      apiKey: p.apiKey,
      allowedOrigins: p.allowedOrigins,
      userCount: p.userCount,
      createdAt: p.createdAt,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * GET /api/dash/projects/:id
 * Get single project details
 */
router.get('/:id', authDeveloper, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, (SELECT COUNT(*) FROM EndUser e WHERE e.projectId = p.id) AS userCount
       FROM Project p
       WHERE p.id = ? AND p.developerId = ?
       LIMIT 1`,
      [req.params.id, req.developer.id]
    );
    const project = rows[0];

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    res.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        logoUrl: project.logoUrl,
        apiKey: project.apiKey,
        allowedOrigins: project.allowedOrigins,
        userCount: project.userCount,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/dash/projects/:id
 * Update project details
 */
router.put('/:id', authDeveloper, async (req, res) => {
  try {
    const { name, description, logoUrl, allowedOrigins } = req.body;

    // Verify ownership
    const [rows] = await db.query(
      'SELECT id FROM Project WHERE id = ? AND developerId = ? LIMIT 1',
      [req.params.id, req.developer.id]
    );
    const project = rows[0];

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl.trim();
    if (allowedOrigins !== undefined) updateData.allowedOrigins = allowedOrigins.trim();

    if (Object.keys(updateData).length > 0) {
      const fields = [];
      const values = [];
      for (const [key, val] of Object.entries(updateData)) {
        fields.push(`\`${key}\` = ?`);
        values.push(val);
      }
      values.push(req.params.id);

      await db.query(
        `UPDATE Project SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [updatedRows] = await db.query(
      'SELECT * FROM Project WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    const updated = updatedRows[0];

    res.json({
      success: true,
      message: 'Project updated successfully.',
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        logoUrl: updated.logoUrl,
        apiKey: updated.apiKey,
        allowedOrigins: updated.allowedOrigins,
      },
    });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * DELETE /api/dash/projects/:id
 * Delete a project and all its data
 */
router.delete('/:id', authDeveloper, async (req, res) => {
  try {
    // Verify ownership
    const [rows] = await db.query(
      'SELECT id FROM Project WHERE id = ? AND developerId = ? LIMIT 1',
      [req.params.id, req.developer.id]
    );
    const project = rows[0];

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    await db.query('DELETE FROM Project WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/dash/projects/:id/regenerate-key
 * Regenerate the API key for a project
 */
router.post('/:id/regenerate-key', authDeveloper, async (req, res) => {
  try {
    // Verify ownership
    const [rows] = await db.query(
      'SELECT id FROM Project WHERE id = ? AND developerId = ? LIMIT 1',
      [req.params.id, req.developer.id]
    );
    const project = rows[0];

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const newApiKey = generateApiKey();

    await db.query('UPDATE Project SET apiKey = ? WHERE id = ?', [newApiKey, req.params.id]);

    res.json({
      success: true,
      message: 'API key regenerated successfully. Update your integrations.',
      data: { apiKey: newApiKey },
    });
  } catch (err) {
    console.error('Regenerate key error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * PUT /api/dash/projects/:id/origins
 * Update allowed origins for a project
 */
router.put('/:id/origins', authDeveloper, async (req, res) => {
  try {
    const { allowedOrigins } = req.body;

    // Verify ownership
    const [rows] = await db.query(
      'SELECT id FROM Project WHERE id = ? AND developerId = ? LIMIT 1',
      [req.params.id, req.developer.id]
    );
    const project = rows[0];

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    await db.query('UPDATE Project SET allowedOrigins = ? WHERE id = ?', [allowedOrigins || '', req.params.id]);

    res.json({
      success: true,
      message: 'Allowed origins updated successfully.',
      data: { allowedOrigins },
    });
  } catch (err) {
    console.error('Update origins error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
