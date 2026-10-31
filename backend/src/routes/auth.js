
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const router = Router();

// Check current user
router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const validEmail =
      typeof email === 'string' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      !validEmail ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: 'Enter name, valid email and password (8+ characters).'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (existing.length) {
      return res.status(409).json({
        message: 'Email already registered.'
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const [roles] = await pool.execute(
      "SELECT id FROM roles WHERE name = 'user'"
    );

    if (!roles.length) {
      return res.status(500).json({
        message: 'Default user role not found.'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO users
       (name, email, password_hash, role_id)
       VALUES (?, ?, ?, ?)`,
      [cleanName, cleanEmail, hash, roles[0].id]
    );

    req.session.user = {
      id: result.insertId,
      name: cleanName,
      email: cleanEmail,
      role: 'user'
    };

    await pool.execute(
      `INSERT INTO login_attempts
       (email_attempted, ip_address, was_successful)
       VALUES (?, ?, TRUE)`,
      [cleanEmail, req.ip]
    );

    res.status(201).json({
      message: 'Registration successful.',
      user: req.session.user
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email and password required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email,
              u.password_hash, u.is_active,
              r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = ?`,
      [cleanEmail]
    );

    const user = rows[0];

    const valid =
      Boolean(user) &&
      Boolean(user.is_active) &&
      await bcrypt.compare(password, user.password_hash);

    await pool.execute(
      `INSERT INTO login_attempts
       (email_attempted, ip_address, was_successful)
       VALUES (?, ?, ?)`,
      [cleanEmail, req.ip, Boolean(valid)]
    );

    if (!valid) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      res.json({ user: req.session.user });
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie('secure_drive.sid');
    res.json({ message: 'Logged out' });
  });
});

export default router;
