import { z } from 'zod';

/**
 * Username validation schema
 * - Minimum 3 characters
 * - Maximum 30 characters
 * - Alphanumeric, underscores, and hyphens allowed
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username is too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .transform(username => username.trim());

/**
 * Password validation schema for registration
 * - Minimum 6 characters
 * - Maximum 128 characters
 */
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password is too long');

/**
 * Simple password schema (for login - no strength check)
 */
export const loginPasswordSchema = z.string().min(1, 'Password is required');

/**
 * Registration schema
 */
export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  username: usernameSchema,
  password: loginPasswordSchema,
});

/**
 * Refresh token schema (from cookie)
 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Password change schema
 */
export const passwordChangeSchema = z
  .object({
    oldPassword: loginPasswordSchema,
    newPassword: passwordSchema,
  })
  .refine(data => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from old password',
    path: ['newPassword'],
  });

/**
 * Session ID schema (for revoking sessions)
 */
export const sessionIdSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

/**
 * Validate and parse request body
 * @param {object} schema - Zod schema
 * @param {object} data - Data to validate
 * @returns {object} { success: boolean, data?: object, error?: object }
 */
export function validateBody(schema, data) {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError && error.errors) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: formattedErrors,
        },
      };
    }
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      },
    };
  }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (password.length > 128) {
    errors.push('Password is too long');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get password strength score (0-4)
 * @param {string} password - Password to evaluate
 * @returns {number} Strength score
 */
export function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) score++;

  return Math.min(score, 4);
}
