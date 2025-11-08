const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res) {
    console.log('[AuthController] Processing registration...');

    try {
      const { email, password, name } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available',
          message: 'Please set up PostgreSQL to use authentication'
        });
      }

      // Check if user already exists
      const existingUser = await db.pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'Email already registered'
        });
      }

      // Hash password
      console.log('[AuthController] Hashing password...');
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = uuidv4();
      const now = new Date();

      await db.pool.query(
        `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, email.toLowerCase(), passwordHash, name || null, now, now]
      );

      console.log('[AuthController] User created:', userId);

      // Generate JWT token
      const token = this._generateToken(userId, email);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: userId,
          email: email.toLowerCase(),
          name: name || null
        },
        token: token
      });

    } catch (error) {
      console.error('[AuthController] Registration error:', error.message);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res) {
    console.log('[AuthController] Processing login...');

    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      // Find user
      const result = await db.pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      const user = result.rows[0];

      // Verify password
      console.log('[AuthController] Verifying password...');
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = this._generateToken(user.id, user.email);

      console.log('[AuthController] Login successful:', user.id);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token: token
      });

    } catch (error) {
      console.error('[AuthController] Login error:', error.message);
      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      const result = await db.pool.query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user: result.rows[0]
      });

    } catch (error) {
      console.error('[AuthController] Profile error:', error.message);
      res.status(500).json({
        error: 'Failed to get profile',
        message: error.message
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, email } = req.body;

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        params.push(name);
        paramIndex++;
      }

      if (email !== undefined) {
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            error: 'Invalid email format'
          });
        }

        // Check if email is already taken
        const existing = await db.pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email.toLowerCase(), userId]
        );

        if (existing.rows.length > 0) {
          return res.status(409).json({
            error: 'Email already in use'
          });
        }

        updates.push(`email = $${paramIndex}`);
        params.push(email.toLowerCase());
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'No fields to update'
        });
      }

      updates.push(`updated_at = $${paramIndex}`);
      params.push(new Date());
      paramIndex++;

      params.push(userId);

      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, name, created_at
      `;

      const result = await db.pool.query(query, params);

      res.json({
        success: true,
        user: result.rows[0]
      });

    } catch (error) {
      console.error('[AuthController] Update profile error:', error.message);
      res.status(500).json({
        error: 'Failed to update profile',
        message: error.message
      });
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'New password must be at least 6 characters long'
        });
      }

      if (!db.pool) {
        return res.status(503).json({
          error: 'Database not available'
        });
      }

      // Get current password hash
      const result = await db.pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        result.rows[0].password_hash
      );

      if (!passwordMatch) {
        return res.status(401).json({
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await db.pool.query(
        'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
        [newPasswordHash, new Date(), userId]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('[AuthController] Change password error:', error.message);
      res.status(500).json({
        error: 'Failed to change password',
        message: error.message
      });
    }
  }

  /**
   * Generate JWT token
   * @private
   */
  _generateToken(userId, email) {
    const payload = {
      id: userId,
      email: email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d' // Token expires in 7 days
    });

    return token;
  }

  /**
   * Verify JWT token (used by middleware)
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AuthController();
