const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all training programs
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { category, active } = req.query;

    let query = `
      SELECT
        tp.*,
        COUNT(ts.id) as session_count,
        COUNT(DISTINCT se.trainee_id) as enrolled_trainees
      FROM training_programs tp
      LEFT JOIN training_sessions ts ON tp.id = ts.program_id
      LEFT JOIN session_enrollments se ON ts.id = se.session_id AND se.status = 'registered'
    `;

    const params = [];
    const conditions = [];

    if (category) {
      conditions.push('tp.category = ?');
      params.push(category);
    }

    if (active !== undefined) {
      conditions.push('tp.is_active = ?');
      params.push(active === 'true' ? 1 : 0);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY tp.id ORDER BY tp.name ASC';

    const [programs] = await pool.execute(query, params);
    res.json(programs);
  } catch (error) {
    next(error);
  }
});

// Get single training program
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const [programs] = await pool.execute(
      `SELECT
        tp.*,
        COUNT(ts.id) as session_count,
        COUNT(DISTINCT se.trainee_id) as enrolled_trainees
      FROM training_programs tp
      LEFT JOIN training_sessions ts ON tp.id = ts.program_id
      LEFT JOIN session_enrollments se ON ts.id = se.session_id AND se.status = 'registered'
      WHERE tp.id = ?
      GROUP BY tp.id`,
      [req.params.id]
    );

    if (programs.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Get associated sessions
    const [sessions] = await pool.execute(
      `SELECT
        ts.*,
        u.first_name as trainer_first_name,
        u.last_name as trainer_last_name,
        COUNT(se.id) as enrolled_count
      FROM training_sessions ts
      LEFT JOIN users u ON ts.trainer_id = u.id
      LEFT JOIN session_enrollments se ON ts.id = se.session_id AND se.status = 'registered'
      WHERE ts.program_id = ?
      GROUP BY ts.id
      ORDER BY ts.session_date ASC`,
      [req.params.id]
    );

    res.json({
      ...programs[0],
      sessions
    });
  } catch (error) {
    next(error);
  }
});

// Create training program (admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), [
  body('name').trim().notEmpty(),
  body('code').trim().notEmpty().isLength({ min: 3, max: 50 }),
  body('category').isIn(['coffee_processing', 'cupping', 'brewing', 'quality_control', 'other']),
  body('durationDays').isInt({ min: 1 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, description, category, durationDays } = req.body;

    // Check if code already exists
    const [existing] = await pool.execute(
      'SELECT id FROM training_programs WHERE code = ?',
      [code]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Program code already exists' });
    }

    const [result] = await pool.execute(
      `INSERT INTO training_programs
       (name, code, description, category, duration_days)
       VALUES (?, ?, ?, ?, ?)`,
      [name, code, description || null, category, durationDays]
    );

    const [newProgram] = await pool.execute(
      'SELECT * FROM training_programs WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newProgram[0]);
  } catch (error) {
    next(error);
  }
});

// Update training program (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), [
  body('name').trim().notEmpty(),
  body('code').trim().notEmpty().isLength({ min: 3, max: 50 }),
  body('category').isIn(['coffee_processing', 'cupping', 'brewing', 'quality_control', 'other']),
  body('durationDays').isInt({ min: 1 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, description, category, durationDays, isActive } = req.body;
    const programId = req.params.id;

    // Check if code already exists for another program
    const [existing] = await pool.execute(
      'SELECT id FROM training_programs WHERE code = ? AND id != ?',
      [code, programId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Program code already exists' });
    }

    await pool.execute(
      `UPDATE training_programs
       SET name = ?, code = ?, description = ?, category = ?, duration_days = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, code, description || null, category, durationDays, isActive !== undefined ? isActive : true, programId]
    );

    const [updatedProgram] = await pool.execute(
      'SELECT * FROM training_programs WHERE id = ?',
      [programId]
    );

    res.json(updatedProgram[0]);
  } catch (error) {
    next(error);
  }
});

// Delete training program (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const programId = req.params.id;

    // Check if program has associated sessions
    const [sessions] = await pool.execute(
      'SELECT COUNT(*) as count FROM training_sessions WHERE program_id = ?',
      [programId]
    );

    if (sessions[0].count > 0) {
      return res.status(409).json({ error: 'Cannot delete program with associated sessions' });
    }

    await pool.execute('DELETE FROM training_programs WHERE id = ?', [programId]);
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get program categories
router.get('/meta/categories', authenticateToken, async (req, res, next) => {
  try {
    const categories = [
      { value: 'coffee_processing', label: 'Coffee Processing' },
      { value: 'cupping', label: 'Coffee Cupping' },
      { value: 'brewing', label: 'Coffee Brewing' },
      { value: 'quality_control', label: 'Quality Control' },
      { value: 'other', label: 'Other' }
    ];
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
