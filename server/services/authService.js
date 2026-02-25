import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../db/prismaClient.js';

// Configuration from environment
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default-access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'rutube-cinema-hub';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS) || 7;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Whether password matches
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT access token
 * @param {object} user - User object with id and username
 * @returns {string} JWT access token
 */
export function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    issuer: JWT_ISSUER,
  });
}

/**
 * Generate a random refresh token
 * @returns {string} Random refresh token
 */
export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('base64url');
}

/**
 * Hash a token using SHA-256
 * @param {string} token - Token to hash
 * @returns {string} Hashed token
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new session for a user
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token (will be hashed)
 * @param {object} metadata - Session metadata (userAgent, ip, fingerprint, name)
 * @returns {Promise<object>} Created session
 */
export async function createSession(userId, refreshToken, metadata = {}) {
  const hashedToken = hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  return prisma.session.create({
    data: {
      userId,
      token: hashedToken,
      userAgent: metadata.userAgent || null,
      ip: metadata.ip || null,
      fingerprint: metadata.fingerprint || null,
      name: metadata.name || generateSessionName(metadata.userAgent),
      expiresAt,
    },
  });
}

/**
 * Refresh a session - rotate tokens
 * @param {string} oldRefreshToken - Old refresh token
 * @param {object} metadata - New session metadata
 * @returns {Promise<object|null>} New tokens and user, or null if invalid
 */
export async function refreshSession(oldRefreshToken, metadata = {}) {
  const hashedOldToken = hashToken(oldRefreshToken);

  // Find the session
  const session = await prisma.session.findUnique({
    where: { token: hashedOldToken },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Check if session is revoked
  if (session.revokedAt) {
    // Token reuse detected - security breach!
    // Revoke all user sessions
    await revokeAllUserSessions(session.userId);
    return { error: 'TOKEN_REUSED' };
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    return { error: 'TOKEN_EXPIRED' };
  }

  // Check if user is active
  if (!session.user.isActive) {
    return { error: 'ACCOUNT_DISABLED' };
  }

  // Generate new tokens
  const newRefreshToken = generateRefreshToken();
  const accessToken = generateAccessToken(session.user);

  // Revoke old session and create new one
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  await createSession(session.user.id, newRefreshToken, {
    ...metadata,
    name: session.name || metadata.name,
  });

  // Update user's last login
  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: session.user.id,
      username: session.user.username,
      isVerified: session.user.isVerified,
      isActive: session.user.isActive,
    },
  };
}

/**
 * Revoke a specific session
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<boolean>} Whether session was revoked
 */
export async function revokeSession(sessionId, userId) {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return false;
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });

  return true;
}

/**
 * Revoke all sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of sessions revoked
 */
export async function revokeAllUserSessions(userId) {
  const result = await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return result.count;
}

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @param {string} currentToken - Current session token hash (to mark current)
 * @returns {Promise<Array>} List of active sessions
 */
export async function getUserSessions(userId, currentToken = null) {
  const sessions = await prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: 'desc' },
  });

  return sessions.map(session => ({
    id: session.id,
    name: session.name,
    userAgent: session.userAgent,
    ip: session.ip,
    isCurrent: currentToken ? session.token === currentToken : false,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    expiresAt: session.expiresAt,
  }));
}

/**
 * Cleanup expired sessions
 * @returns {Promise<number>} Number of deleted sessions
 */
export async function cleanupExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
    },
  });

  return result.count;
}

/**
 * Parse user agent string to extract browser and OS info
 * @param {string} ua - User agent string
 * @returns {object} Parsed browser and OS
 */
export function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };

  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';
  else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';

  // Detect OS (check iOS before macOS since iOS UA contains "Mac OS X")
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) os = 'iOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
}

/**
 * Generate a user-friendly session name
 * @param {string} userAgent - User agent string
 * @returns {string} Session name
 */
export function generateSessionName(userAgent) {
  if (!userAgent) return 'Unknown Device';

  const { browser, os } = parseUserAgent(userAgent);
  return `${browser} on ${os}`;
}

/**
 * Register a new user
 * @param {string} username - User username
 * @param {string} password - User password
 * @param {object} metadata - Session metadata
 * @returns {Promise<object>} Created user and tokens
 */
export async function registerUser(username, password, metadata = {}) {
  // Normalize username
  const normalizedUsername = username.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: normalizedUsername },
  });

  if (existingUser) {
    return { error: 'USERNAME_EXISTS' };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      username: normalizedUsername,
      passwordHash,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Create session
  await createSession(user.id, refreshToken, metadata);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  };
}

/**
 * Login a user
 * @param {string} username - User username
 * @param {string} password - User password
 * @param {object} metadata - Session metadata
 * @returns {Promise<object>} User and tokens
 */
export async function loginUser(username, password, metadata = {}) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase().trim() },
  });

  if (!user) {
    return { error: 'INVALID_CREDENTIALS' };
  }

  // Check if user is active
  if (!user.isActive) {
    return { error: 'ACCOUNT_DISABLED' };
  }

  // Verify password
  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return { error: 'INVALID_CREDENTIALS' };
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Create session
  await createSession(user.id, refreshToken, metadata);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      isVerified: user.isVerified,
      isActive: user.isActive,
      lastLoginAt: new Date(),
    },
  };
}

/**
 * Logout a user by revoking their session
 * @param {string} refreshToken - Refresh token to revoke
 * @returns {Promise<boolean>} Whether logout was successful
 */
export async function logoutUser(refreshToken) {
  if (!refreshToken) return false;

  const hashedToken = hashToken(refreshToken);

  const session = await prisma.session.findUnique({
    where: { token: hashedToken },
  });

  if (!session) return false;

  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  return true;
}

/**
 * Verify a JWT access token
 * @param {string} token - JWT access token
 * @returns {object|null} Decoded token payload or null
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: JWT_ISSUER,
    });
  } catch {
    return null;
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User object
 */
export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    isVerified: user.isVerified,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} currentRefreshToken - Current refresh token (to keep session)
 * @returns {Promise<object>} Result
 */
export async function changePassword(userId, oldPassword, newPassword, currentRefreshToken) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { error: 'USER_NOT_FOUND' };
  }

  // Verify old password
  const isValid = await comparePassword(oldPassword, user.passwordHash);
  if (!isValid) {
    return { error: 'INVALID_OLD_PASSWORD' };
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Revoke all sessions except current
  if (currentRefreshToken) {
    const hashedCurrentToken = hashToken(currentRefreshToken);
    await prisma.session.updateMany({
      where: {
        userId,
        token: { not: hashedCurrentToken },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  } else {
    await revokeAllUserSessions(userId);
  }

  return { success: true };
}
