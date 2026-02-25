import rateLimit from 'express-rate-limit';

// Check if we're in test/development mode - disable rate limiting for tests
const isTestMode = process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true';

// Rate limit configurations from environment
const LOGIN_WINDOW_MS = parseInt(process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_REQUESTS = parseInt(process.env.AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS) || 5;

const REGISTER_WINDOW_MS =
  parseInt(process.env.AUTH_REGISTER_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000; // 1 hour
const REGISTER_MAX_REQUESTS = parseInt(process.env.AUTH_REGISTER_RATE_LIMIT_MAX_REQUESTS) || 3;

const REFRESH_WINDOW_MS = parseInt(process.env.AUTH_REFRESH_RATE_LIMIT_WINDOW_MS) || 60 * 1000; // 1 minute
const REFRESH_MAX_REQUESTS = parseInt(process.env.AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS) || 10;

const PASSWORD_RESET_WINDOW_MS =
  parseInt(process.env.AUTH_PASSWORD_RESET_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000; // 1 hour
const PASSWORD_RESET_MAX_REQUESTS =
  parseInt(process.env.AUTH_PASSWORD_RESET_RATE_LIMIT_MAX_REQUESTS) || 3;

/**
 * Create a rate limiter with custom options
 */
function createRateLimiter(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests, please try again later',
          details: {
            retryAfter: Math.ceil(windowMs / 1000),
            limit: max,
            window:
              windowMs >= 60000
                ? `${Math.ceil(windowMs / 60000)} minutes`
                : `${Math.ceil(windowMs / 1000)} seconds`,
          },
        },
      });
    },
    // Use default keyGenerator (handles IPv6 properly)
  });
}

/**
 * Skip middleware in test mode
 */
const skipInTest = (req, res, next) => next();

/**
 * Rate limiter for login endpoint
 * 5 requests per 15 minutes per IP
 */
export const loginLimiter = isTestMode
  ? skipInTest
  : createRateLimiter(
      LOGIN_WINDOW_MS,
      LOGIN_MAX_REQUESTS,
      'Too many login attempts, please try again later'
    );

/**
 * Rate limiter for register endpoint
 * 3 requests per hour per IP
 */
export const registerLimiter = isTestMode
  ? skipInTest
  : createRateLimiter(
      REGISTER_WINDOW_MS,
      REGISTER_MAX_REQUESTS,
      'Too many registration attempts, please try again later'
    );

/**
 * Rate limiter for refresh token endpoint
 * 10 requests per minute per session
 */
export const refreshLimiter = isTestMode
  ? skipInTest
  : createRateLimiter(REFRESH_WINDOW_MS, REFRESH_MAX_REQUESTS, 'Too many token refresh requests');

/**
 * Rate limiter for password reset endpoint
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = isTestMode
  ? skipInTest
  : createRateLimiter(
      PASSWORD_RESET_WINDOW_MS,
      PASSWORD_RESET_MAX_REQUESTS,
      'Too many password reset requests, please try again later'
    );

/**
 * Combined rate limiter for auth endpoints
 * Can be used as a general protection
 */
export const authLimiter = isTestMode
  ? skipInTest
  : createRateLimiter(
      60 * 1000, // 1 minute
      20, // 20 requests
      'Too many authentication requests'
    );
