const authService = require('../services/authService');
const { AppError } = require('./errorHandler');

/**
 * Middleware to verify admin authentication
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Validate session in database
    const session = await authService.validateSession(token);
    if (!session) {
      throw new AppError('Session expired or invalid', 401);
    }

    // Attach admin info to request
    req.admin = {
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

/**
 * Optional admin check (for routes that work differently for admin)
 */
const optionalAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      
      if (decoded) {
        const session = await authService.validateSession(token);
        if (session) {
          req.admin = {
            username: decoded.username,
            role: decoded.role
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without admin privileges
    next();
  }
};

module.exports = {
  requireAdmin,
  optionalAdmin
};
