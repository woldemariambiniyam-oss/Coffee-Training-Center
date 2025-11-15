const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all training sessions
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status, upcoming, programId } = req.query;

    let query = `
      SELECT
        ts.*,
        u.first_name as trainer_first_name,
        u.last_name as trainer_last_name,
        tp.name as program_name,
        tp.code as program_code,
        COUNT(se.id) as enrolled_count
      FROM training_sessions ts
      LEFT JOIN users u ON ts.trainer_id = u.id
      LEFT JOIN training_programs tp ON ts.program_id = tp.id
      LEFT JOIN session_enrollments se ON ts.id = se.session_id AND se.status = 'registered'
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND ts.status = ?';
      params.push(status);
    }

    if (upcoming === 'true') {
      query += ' AND ts.session_date > NOW()';
    }

    if (programId) {
      query += ' AND ts.program_id = ?';
      params.push(programId);
    }

    query += ' GROUP BY ts.id ORDER BY ts.session_date ASC';

    const [sessions] = await pool.execute(query, params);

    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// Get single training session
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const [sessions] = await pool.execute(
      `SELECT 
        ts.*,
        u.first_name as trainer_first_name,
        u.last_name as trainer_last_name
      FROM training_sessions ts
      LEFT JOIN users u ON ts.trainer_id = u.id
      WHERE ts.id = ?`,
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get enrollments
    const [enrollments] = await pool.execute(
      `SELECT 
        se.*,
        u.first_name,
        u.last_name,
        u.email
      FROM session_enrollments se
      JOIN users u ON se.trainee_id = u.id
      WHERE se.session_id = ?`,
      [req.params.id]
    );

    res.json({
      ...sessions[0],
      enrollments
    });
  } catch (error) {
    next(error);
  }
});

// Create training session (admin/trainer only)
router.post('/', authenticateToken, authorizeRoles('admin', 'trainer'), [
  body('title').trim().notEmpty(),
  body('sessionDate').isISO8601(),
  body('durationMinutes').isInt({ min: 1 }),
  body('maxCapacity').isInt({ min: 1 }),
  body('programId').optional().isInt()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, sessionDate, durationMinutes, maxCapacity, location, programId } = req.body;
    const trainerId = req.user.role === 'trainer' ? req.user.id : req.body.trainerId || null;

    // Check for trainer conflicts if trainerId is provided
    if (trainerId) {
      const [conflicts] = await pool.execute(
        `SELECT id FROM training_sessions
         WHERE trainer_id = ? AND session_date = ? AND status != 'cancelled'`,
        [trainerId, sessionDate]
      );

      if (conflicts.length > 0) {
        return res.status(409).json({ error: 'Trainer has a conflicting session at this time' });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO training_sessions
       (title, description, trainer_id, session_date, duration_minutes, max_capacity, location, program_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, trainerId, sessionDate, durationMinutes, maxCapacity, location || null, programId || null]
    );

    const [newSession] = await pool.execute(
      'SELECT * FROM training_sessions WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newSession[0]);
  } catch (error) {
    next(error);
  }
});

// Enroll in training session
router.post('/:id/enroll', authenticateToken, async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const traineeId = req.user.id;

    // Check if session exists and has capacity
    const [sessions] = await pool.execute(
      'SELECT * FROM training_sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions[0];

    if (session.status !== 'scheduled') {
      return res.status(400).json({ error: 'Session is not available for enrollment' });
    }

    // Check current enrollment
    const [enrollments] = await pool.execute(
      'SELECT COUNT(*) as count FROM session_enrollments WHERE session_id = ? AND status = "registered"',
      [sessionId]
    );

    if (enrollments[0].count >= session.max_capacity) {
      return res.status(400).json({ error: 'Session is full' });
    }

    // Check if already enrolled
    const [existing] = await pool.execute(
      'SELECT id FROM session_enrollments WHERE trainee_id = ? AND session_id = ?',
      [traineeId, sessionId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Already enrolled in this session' });
    }

    // Enroll
    await pool.execute(
      'INSERT INTO session_enrollments (trainee_id, session_id, status) VALUES (?, ?, ?)',
      [traineeId, sessionId, 'registered']
    );

    res.status(201).json({ message: 'Successfully enrolled in session' });
  } catch (error) {
    next(error);
  }
});

// Get my enrollments
router.get('/my/enrollments', authenticateToken, async (req, res, next) => {
  try {
    const [enrollments] = await pool.execute(
      `SELECT 
        se.*,
        ts.title,
        ts.session_date,
        ts.duration_minutes,
        ts.location,
        ts.status as session_status
      FROM session_enrollments se
      JOIN training_sessions ts ON se.session_id = ts.id
      WHERE se.trainee_id = ?
      ORDER BY ts.session_date DESC`,
      [req.user.id]
    );

    res.json(enrollments);
  } catch (error) {
    next(error);
  }
});

module.exports = router;


