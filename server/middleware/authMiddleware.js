import { verifyAccessToken } from '../services/authService.js';

/**
 * Middleware to authenticate requests using JWT
 * Attaches user to request object if token is valid
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token is required',
      },
    });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Access token is invalid or expired',
      },
    });
  }

  // Attach user to request
  req.user = {
    id: decoded.userId,
    email: decoded.email,
  };

  next();
}

/**
 * Middleware for optional authentication
 * Attaches user if token present, but doesn't require it
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };
    }
  }

  next();
}

/**
 * Middleware to require authentication
 * Must be used after authenticateToken
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }
  next();
}

/**
 * Middleware to require email verification
 * Must be used after authenticateToken
 */
export async function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  // Import here to avoid circular dependency
  const { getUserById } = await import('../services/authService.js');
  const user = await getUserById(req.user.id);

  if (!user || !user.isVerified) {
    return res.status(403).json({
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification is required',
      },
    });
  }

  next();
}
