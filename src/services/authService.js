const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../database/connection');

/**
 * Admin Authentication Service
 */
class AuthService {
  /**
   * Authenticate admin user
   */
  authenticate(username, password) {
    if (username === config.admin.username && password === config.admin.password) {
      return true;
    }
    return false;
  }

  /**
   * Generate JWT token for admin
   */
  generateToken(username) {
    const payload = {
      username,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Store session in database
   */
  async createSession(username, token) {
    const { v4: uuidv4 } = require('uuid');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await db.execute({
      sql: 'INSERT INTO admin_sessions (id, username, token, expires_at) VALUES (?, ?, ?, ?)',
      args: [uuidv4(), username, token, expiresAt]
    });
  }

  /**
   * Validate session
   */
  async validateSession(token) {
    const result = await db.execute({
      sql: 'SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime("now")',
      args: [token]
    });
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(token) {
    await db.execute({
      sql: 'DELETE FROM admin_sessions WHERE token = ?',
      args: [token]
    });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    await db.execute({
      sql: 'DELETE FROM admin_sessions WHERE expires_at < datetime("now")'
    });
  }
}

module.exports = new AuthService();
