const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    
    let query = `
      SELECT 
        id, email, first_name, last_name, phone, role, status, 
        created_at, updated_at, last_login_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.execute(query, params);

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get single user (admin only, or own profile)
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Users can view their own profile, admins can view any
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const [users] = await pool.execute(
      `SELECT 
        id, email, first_name, last_name, phone, role, status, 
        created_at, updated_at, last_login_at, two_factor_enabled
      FROM users
      WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    next(error);
  }
});

// Create user (admin only) - for creating trainers and admins
router.post('/', authenticateToken, authorizeRoles('admin'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['trainee', 'trainer', 'admin']),
  body('phone').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, passwordHash, firstName, lastName, phone || null, role, 'active']
    );

    const userId = result.insertId;

    // Send welcome notification
    await notificationService.sendRegistrationConfirmation(
      userId,
      email,
      phone,
      firstName
    );

    // If trainer or admin, send invitation email
    if (role === 'trainer' || role === 'admin') {
      await notificationService.sendAccountInvitation(
        userId,
        email,
        firstName,
        role,
        password // Temporary password
      );
    }

    await auditService.logAction(req.user.id, 'USER_CREATED', 'user', userId, { createdRole: role }, req);

    const [newUser] = await pool.execute(
      'SELECT id, email, first_name, last_name, phone, role, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUser[0]
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticateToken, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
  body('role').optional().isIn(['trainee', 'trainer', 'admin', 'public_verifier'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = parseInt(req.params.id);
    const { firstName, lastName, phone, status, role } = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Non-admins can only update limited fields
    const updates = [];
    const params = [];

    if (firstName) {
      updates.push('first_name = ?');
      params.push(firstName);
    }

    if (lastName) {
      updates.push('last_name = ?');
      params.push(lastName);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }

    // Only admins can update status
    if (status && req.user.role === 'admin') {
      updates.push('status = ?');
      params.push(status);
    }

    // Only admins can update role
    if (role && req.user.role === 'admin') {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(userId);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    await auditService.logAction(req.user.id, 'USER_UPDATED', 'user', userId, { updatedFields: Object.keys(req.body) }, req);

    const [updatedUser] = await pool.execute(
      'SELECT id, email, first_name, last_name, phone, role, status, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent deleting yourself
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const [users] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete by setting status to inactive
    await pool.execute(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      ['inactive', userId]
    );

    await auditService.logAction(req.user.id, 'USER_DELETED', 'user', userId, {}, req);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Reset user password (admin only)
router.post('/:id/reset-password', authenticateToken, authorizeRoles('admin'), [
  body('newPassword').isLength({ min: 6 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId]
    );

    await auditService.logAction(req.user.id, 'PASSWORD_RESET_BY_ADMIN', 'user', userId, {}, req);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

