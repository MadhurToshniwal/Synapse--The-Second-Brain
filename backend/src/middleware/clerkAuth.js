const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Initialize Clerk client
const clerkClient = createClerkClient({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Middleware to verify Clerk JWT tokens
 * Extracts user info from Clerk token and attaches to req.user
 */
const verifyClerkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - allow anonymous access
      req.user = { id: '00000000-0000-0000-0000-000000000000' };
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the token with Clerk
      const session = await clerkClient.verifyToken(token, {
        jwtKey: process.env.CLERK_PUBLISHABLE_KEY,
      });

      // Get user details from Clerk
      const user = await clerkClient.users.getUser(session.sub);

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        clerkUser: user,
      };

      console.log(`[ClerkAuth] Authenticated user: ${req.user.email}`);
      next();
    } catch (verifyError) {
      console.error('[ClerkAuth] Token verification failed:', verifyError.message);
      // If verification fails, allow anonymous access
      req.user = { id: '00000000-0000-0000-0000-000000000000' };
      next();
    }
  } catch (error) {
    console.error('[ClerkAuth] Error:', error.message);
    // On error, allow anonymous access
    req.user = { id: '00000000-0000-0000-0000-000000000000' };
    next();
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalClerkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = { id: '00000000-0000-0000-0000-000000000000' };
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const session = await clerkClient.verifyToken(token, {
        jwtKey: process.env.CLERK_PUBLISHABLE_KEY,
      });

      const user = await clerkClient.users.getUser(session.sub);

      req.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        clerkUser: user,
      };
    } catch (verifyError) {
      // Silently fail - use anonymous
      req.user = { id: '00000000-0000-0000-0000-000000000000' };
    }

    next();
  } catch (error) {
    req.user = { id: '00000000-0000-0000-0000-000000000000' };
    next();
  }
};

/**
 * Required authentication - returns error if no valid token
 */
const requireClerkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to access this resource',
      });
    }

    const token = authHeader.substring(7);

    try {
      const session = await clerkClient.verifyToken(token, {
        jwtKey: process.env.CLERK_PUBLISHABLE_KEY,
      });

      const user = await clerkClient.users.getUser(session.sub);

      req.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        clerkUser: user,
      };

      next();
    } catch (verifyError) {
      console.error('[ClerkAuth] Token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Please sign in again',
      });
    }
  } catch (error) {
    console.error('[ClerkAuth] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: error.message,
    });
  }
};

module.exports = {
  verifyClerkToken,
  optionalClerkAuth,
  requireClerkAuth,
  clerkClient,
};
