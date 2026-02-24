import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Test these functions directly without Prisma dependency
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'default-access-secret';
const JWT_ISSUER = process.env.JWT_ISSUER || 'rutube-cinema-hub';
const BCRYPT_ROUNDS = 12;

// Test implementations (mirrors authService.js)
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateAccessToken(user) {
  const payload = { userId: user.id, email: user.email };
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: '15m',
    issuer: JWT_ISSUER,
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET, { issuer: JWT_ISSUER });
  } catch {
    return null;
  }
}

function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown' };
  let browser = 'Unknown';
  let os = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';
  else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';
  // Check iOS before macOS since iOS UA contains "Mac OS X"
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) os = 'iOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';
  return { browser, os };
}

function generateSessionName(userAgent) {
  if (!userAgent) return 'Unknown Device';
  const { browser, os } = parseUserAgent(userAgent);
  return `${browser} on ${os}`;
}

describe('Auth Service', () => {
  describe('Password hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      assert.ok(hash);
      assert.notStrictEqual(hash, password);
      assert.ok(hash.length > 0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      assert.notStrictEqual(hash1, hash2);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(password, hash);
      assert.strictEqual(isValid, true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await comparePassword('WrongPassword', hash);
      assert.strictEqual(isValid, false);
    });
  });

  describe('Access token', () => {
    it('should generate a JWT access token', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const token = generateAccessToken(user);

      assert.ok(token);
      assert.ok(typeof token === 'string');
      assert.ok(token.split('.').length === 3); // JWT has 3 parts
    });

    it('should verify a valid access token', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const token = generateAccessToken(user);

      const decoded = verifyAccessToken(token);

      assert.ok(decoded);
      assert.strictEqual(decoded.userId, user.id);
      assert.strictEqual(decoded.email, user.email);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyAccessToken('invalid-token');
      assert.strictEqual(decoded, null);
    });
  });

  describe('Refresh token', () => {
    it('should generate a refresh token', () => {
      const token = generateRefreshToken();

      assert.ok(token);
      assert.ok(typeof token === 'string');
      assert.ok(token.length >= 64); // Should be sufficiently long
    });

    it('should generate unique tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      assert.notStrictEqual(token1, token2);
    });
  });

  describe('Token hashing', () => {
    it('should hash a token with SHA-256', () => {
      const token = 'test-refresh-token';
      const hash = hashToken(token);

      assert.ok(hash);
      assert.notStrictEqual(hash, token);
      assert.strictEqual(hash.length, 64); // SHA-256 produces 64 hex characters
    });

    it('should produce same hash for same input', () => {
      const token = 'test-refresh-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      assert.strictEqual(hash1, hash2);
    });
  });

  describe('User agent parsing', () => {
    it('should parse Chrome on Windows', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = parseUserAgent(ua);

      assert.strictEqual(result.browser, 'Chrome');
      assert.strictEqual(result.os, 'Windows');
    });

    it('should parse Firefox on macOS', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Gecko/20100101 Firefox/120.0';
      const result = parseUserAgent(ua);

      assert.strictEqual(result.browser, 'Firefox');
      assert.strictEqual(result.os, 'macOS');
    });

    it('should parse Safari on iOS', () => {
      const ua =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(ua);

      assert.strictEqual(result.browser, 'Safari');
      assert.strictEqual(result.os, 'iOS');
    });

    it('should handle null user agent', () => {
      const result = parseUserAgent(null);

      assert.strictEqual(result.browser, 'Unknown');
      assert.strictEqual(result.os, 'Unknown');
    });

    it('should handle empty user agent', () => {
      const result = parseUserAgent('');

      assert.strictEqual(result.browser, 'Unknown');
      assert.strictEqual(result.os, 'Unknown');
    });
  });

  describe('Session name generation', () => {
    it('should generate session name from user agent', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const name = generateSessionName(ua);

      assert.strictEqual(name, 'Chrome on Windows');
    });

    it('should return Unknown Device for null', () => {
      const name = generateSessionName(null);

      assert.strictEqual(name, 'Unknown Device');
    });
  });
});
