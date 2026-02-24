import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  getUserById,
  getUserSessions,
  revokeSession,
  revokeAllUserSessions,
  changePassword,
  hashToken,
} from '../services/authService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  passwordResetLimiter,
} from '../middleware/rateLimitAuth.js';
import {
  registerSchema,
  loginSchema,
  passwordChangeSchema,
  validateBody,
} from '../schemas/authSchemas.js';

const router = Router();

// Cookie configuration
const COOKIE_NAME = 'refreshToken';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get session metadata from request
 */
function getSessionMetadata(req) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
  };
}

/**
 * Set refresh token cookie
 */
function setRefreshTokenCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/api/auth',
  });
}

/**
 * Clear refresh token cookie
 */
function clearRefreshTokenCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth',
  });
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerLimiter, async (req, res) => {
  // Validate input
  const validation = validateBody(registerSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { email, password } = validation.data;
  const metadata = getSessionMetadata(req);

  try {
    const result = await registerUser(email, password, metadata);

    if (result.error) {
      if (result.error === 'EMAIL_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email is already registered',
          },
        });
      }
      return res.status(400).json({
        error: {
          code: result.error,
          message: 'Registration failed',
        },
      });
    }

    // Set refresh token cookie
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Login a user
 */
router.post('/login', loginLimiter, async (req, res) => {
  // Validate input
  const validation = validateBody(loginSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { email, password } = validation.data;
  const metadata = getSessionMetadata(req);

  try {
    const result = await loginUser(email, password, metadata);

    if (result.error) {
      if (result.error === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Email or password is incorrect',
          },
        });
      }
      if (result.error === 'ACCOUNT_DISABLED') {
        return res.status(403).json({
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account has been deactivated',
          },
        });
      }
      return res.status(400).json({
        error: {
          code: result.error,
          message: 'Login failed',
        },
      });
    }

    // Set refresh token cookie
    setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout current session
 */
router.post('/logout', authenticateToken, async (req, res) => {
  const refreshToken = req.cookies?.[COOKIE_NAME];

  try {
    await logoutUser(refreshToken);
    clearRefreshTokenCookie(res);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookie on error
    clearRefreshTokenCookie(res);
    res.json({ message: 'Logged out successfully' });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout all sessions
 */
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    const count = await revokeAllUserSessions(req.user.id);
    clearRefreshTokenCookie(res);

    res.json({
      message: 'All sessions revoked successfully',
      revokedCount: count,
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to revoke sessions',
      },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', refreshLimiter, async (req, res) => {
  const refreshToken = req.cookies?.[COOKIE_NAME];

  if (!refreshToken) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Refresh token is required',
      },
    });
  }

  const metadata = getSessionMetadata(req);

  try {
    const result = await refreshSession(refreshToken, metadata);

    if (!result) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid refresh token',
        },
      });
    }

    if (result.error) {
      clearRefreshTokenCookie(res);

      if (result.error === 'TOKEN_REUSED') {
        return res.status(403).json({
          error: {
            code: 'TOKEN_REUSED',
            message: 'Token reuse detected. All sessions have been revoked for security.',
          },
        });
      }
      if (result.error === 'TOKEN_EXPIRED') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Refresh token has expired',
          },
        });
      }
      if (result.error === 'ACCOUNT_DISABLED') {
        return res.status(403).json({
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account has been deactivated',
          },
        });
      }

      return res.status(400).json({
        error: {
          code: result.error,
          message: 'Token refresh failed',
        },
      });
    }

    // Set new refresh token cookie
    setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    clearRefreshTokenCookie(res);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

/**
 * GET /api/auth/sessions
 * Get all active sessions for current user
 */
router.get('/sessions', authenticateToken, async (req, res) => {
  const refreshToken = req.cookies?.[COOKIE_NAME];
  const currentTokenHash = refreshToken ? hashToken(refreshToken) : null;

  try {
    const sessions = await getUserSessions(req.user.id, currentTokenHash);
    res.json({ sessions, total: sessions.length });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;
  const refreshToken = req.cookies?.[COOKIE_NAME];

  try {
    // Check if trying to revoke current session
    if (refreshToken) {
      const currentTokenHash = hashToken(refreshToken);
      const sessions = await getUserSessions(req.user.id, currentTokenHash);
      const currentSession = sessions.find(s => s.isCurrent);

      if (currentSession && currentSession.id === sessionId) {
        return res.status(403).json({
          error: {
            code: 'CANNOT_REVOKE_CURRENT',
            message: 'Cannot revoke current session. Use logout instead.',
          },
        });
      }
    }

    const revoked = await revokeSession(sessionId, req.user.id);

    if (!revoked) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found or does not belong to user',
        },
      });
    }

    res.json({ message: 'Session revoked successfully', sessionId });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

/**
 * PATCH /api/auth/password
 * Change password
 */
router.patch('/password', authenticateToken, passwordResetLimiter, async (req, res) => {
  const validation = validateBody(passwordChangeSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { oldPassword, newPassword } = validation.data;
  const refreshToken = req.cookies?.[COOKIE_NAME];

  try {
    const result = await changePassword(req.user.id, oldPassword, newPassword, refreshToken);

    if (result.error) {
      if (result.error === 'INVALID_OLD_PASSWORD') {
        return res.status(401).json({
          error: {
            code: 'INVALID_OLD_PASSWORD',
            message: 'Current password is incorrect',
          },
        });
      }
      return res.status(400).json({
        error: {
          code: result.error,
          message: 'Password change failed',
        },
      });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  }
});

export default router;
