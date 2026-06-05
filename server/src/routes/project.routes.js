const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const authDeveloper = require('../middleware/authDeveloper');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Generate a unique API key in the format: lusm_xxxx_xxxx_xxxx
 */
const generateApiKey = () => {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    segments.push(
      uuidv4().replace(/-/g, '').substring(0, 8)
    );
  }
  return `lusm_${segments.join('_')}`;
};

/**
 * POST /api/dash/projects
 * Create a new project
 */
router.post('/', authDeveloper, async (req, res) => {
  try {
    const { name, description, allowedOrigins } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required.',
      });
    }

    // Check project limit (max 10 projects per developer for free tier)
    const projectCount = await prisma.project.count({
      where: { developerId: req.developer.id },
    });

    if (projectCount >= 10) {
      return res.status(403).json({
        success: false,
        message: 'Maximum project limit (10) reached.',
      });
    }

    const apiKey = generateApiKey();

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description || '',
        apiKey,
        allowedOrigins: allowedOrigins || '',
        developerId: req.developer.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        apiKey: project.apiKey,
        allowedOrigins: project.allowedOrigins,
        createdAt: project.createdAt,
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
    const projects = await prisma.project.findMany({
      where: { developerId: req.developer.id },
      include: {
        _count: { select: { endUsers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      apiKey: p.apiKey,
      allowedOrigins: p.allowedOrigins,
      userCount: p._count.endUsers,
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
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        developerId: req.developer.id,
      },
      include: {
        _count: { select: { endUsers: true } },
      },
    });

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
        apiKey: project.apiKey,
        allowedOrigins: project.allowedOrigins,
        userCount: project._count.endUsers,
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
    const { name, description } = req.body;

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, developerId: req.developer.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Project updated successfully.',
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
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
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, developerId: req.developer.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    await prisma.project.delete({ where: { id: req.params.id } });

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
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, developerId: req.developer.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const newApiKey = generateApiKey();

    await prisma.project.update({
      where: { id: req.params.id },
      data: { apiKey: newApiKey },
    });

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

    const project = await prisma.project.findFirst({
      where: { id: req.params.id, developerId: req.developer.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    await prisma.project.update({
      where: { id: req.params.id },
      data: { allowedOrigins: allowedOrigins || '' },
    });

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
