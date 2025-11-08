const authController = require('../controllers/authController');

/**
 * Middleware to verify JWT token and authenticate requests
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization token provided',
        message: 'Please provide a valid JWT token in the Authorization header'
      });
    }

    // Extract token (format: "Bearer <token>")
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization format',
        message: 'Use format: Authorization: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = authController.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: 'Please login again'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    console.log(`[Auth] Authenticated user: ${decoded.email}`);

    next();

  } catch (error) {
    console.error('[Auth] Authentication error:', error.message);
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work with or without auth
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const decoded = authController.verifyToken(token);

      if (decoded) {
        req.user = {
          id: decoded.id,
          email: decoded.email
        };
      }
    }

    next();

  } catch (error) {
    // Error in optional auth, continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};
