import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  usernameSchema,
  passwordSchema,
  loginPasswordSchema,
  registerSchema,
  loginSchema,
  passwordChangeSchema,
  validateBody,
  validatePasswordStrength,
  getPasswordStrength,
} from '../../server/schemas/authSchemas.js';

describe('Auth Schemas', () => {
  describe('Username validation', () => {
    it('should validate a valid username', () => {
      const result = usernameSchema.parse('testuser');
      assert.strictEqual(result, 'testuser');
    });

    it('should trim whitespace from valid input', () => {
      const result = usernameSchema.parse('testuser');
      assert.strictEqual(result, 'testuser');
    });

    it('should accept underscores', () => {
      const result = usernameSchema.parse('test_user');
      assert.strictEqual(result, 'test_user');
    });

    it('should accept hyphens', () => {
      const result = usernameSchema.parse('test-user');
      assert.strictEqual(result, 'test-user');
    });

    it('should accept numbers', () => {
      const result = usernameSchema.parse('user123');
      assert.strictEqual(result, 'user123');
    });

    it('should reject invalid characters', () => {
      assert.throws(() => usernameSchema.parse('test@user'));
    });

    it('should reject short username', () => {
      assert.throws(() => usernameSchema.parse('ab'));
    });

    it('should reject empty string', () => {
      assert.throws(() => usernameSchema.parse(''));
    });
  });

  describe('Password validation', () => {
    it('should accept a password with 6+ characters', () => {
      const password = 'simple123';
      const result = passwordSchema.parse(password);
      assert.strictEqual(result, password);
    });

    it('should accept any characters', () => {
      const password = 'abc123!@#';
      const result = passwordSchema.parse(password);
      assert.strictEqual(result, password);
    });

    it('should reject password shorter than 6 characters', () => {
      assert.throws(() => passwordSchema.parse('12345'));
    });

    it('should reject password longer than 128 characters', () => {
      const longPassword = 'A'.repeat(129);
      assert.throws(() => passwordSchema.parse(longPassword));
    });
  });

  describe('Login password validation', () => {
    it('should accept any non-empty password', () => {
      const result = loginPasswordSchema.parse('anypassword');
      assert.strictEqual(result, 'anypassword');
    });

    it('should reject empty password', () => {
      assert.throws(() => loginPasswordSchema.parse(''));
    });
  });

  describe('Register schema', () => {
    it('should validate valid registration data', () => {
      const data = { username: 'testuser', password: 'password123' };
      const result = registerSchema.parse(data);
      assert.strictEqual(result.username, 'testuser');
      assert.strictEqual(result.password, 'password123');
    });

    it('should reject registration with short password', () => {
      const data = { username: 'testuser', password: '12345' };
      assert.throws(() => registerSchema.parse(data));
    });

    it('should reject registration with short username', () => {
      const data = { username: 'ab', password: 'password123' };
      assert.throws(() => registerSchema.parse(data));
    });
  });

  describe('Login schema', () => {
    it('should validate valid login data', () => {
      const data = { username: 'testuser', password: 'anypassword' };
      const result = loginSchema.parse(data);
      assert.strictEqual(result.username, 'testuser');
      assert.strictEqual(result.password, 'anypassword');
    });
  });

  describe('Password change schema', () => {
    it('should validate valid password change', () => {
      const data = { oldPassword: 'oldpass123', newPassword: 'newpass456' };
      const result = passwordChangeSchema.parse(data);
      assert.strictEqual(result.oldPassword, 'oldpass123');
      assert.strictEqual(result.newPassword, 'newpass456');
    });

    it('should reject same old and new password', () => {
      const data = { oldPassword: 'samepass123', newPassword: 'samepass123' };
      assert.throws(() => passwordChangeSchema.parse(data));
    });

    it('should reject short new password', () => {
      const data = { oldPassword: 'oldpass123', newPassword: '12345' };
      assert.throws(() => passwordChangeSchema.parse(data));
    });
  });

  describe('validateBody helper', () => {
    it('should return success for valid data', () => {
      const data = { username: 'testuser', password: 'password123' };
      const result = validateBody(registerSchema, data);

      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });

    it('should return error for invalid data', () => {
      const data = { username: 'ab', password: '12345' };
      const result = validateBody(registerSchema, data);

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('Password strength validation', () => {
    it('should validate password with 6+ characters', () => {
      const result = validatePasswordStrength('password123');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should report error for short password', () => {
      const result = validatePasswordStrength('12345');
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });
  });

  describe('Password strength score', () => {
    it('should score 0 for very short password', () => {
      const score = getPasswordStrength('x');
      assert.strictEqual(score, 0);
    });

    it('should score 1 for 6+ chars', () => {
      const score = getPasswordStrength('abcdef');
      assert.strictEqual(score, 1);
    });

    it('should score higher for complex password', () => {
      const score = getPasswordStrength('Password123!');
      assert.ok(score >= 4);
    });

    it('should max at 4', () => {
      const score = getPasswordStrength('VeryLongPassword123!@#');
      assert.strictEqual(score, 4);
    });
  });
});
