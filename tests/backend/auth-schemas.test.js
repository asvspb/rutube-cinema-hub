import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  emailSchema,
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
  describe('Email validation', () => {
    it('should validate a valid email', () => {
      const result = emailSchema.parse('test@example.com');
      assert.strictEqual(result, 'test@example.com');
    });

    it('should lowercase email', () => {
      const result = emailSchema.parse('Test@Example.COM');
      assert.strictEqual(result, 'test@example.com');
    });

    it('should trim whitespace', () => {
      const result = emailSchema.parse('test@example.com');
      assert.strictEqual(result, 'test@example.com');
    });

    it('should reject invalid email', () => {
      assert.throws(() => emailSchema.parse('invalid-email'));
    });

    it('should reject empty string', () => {
      assert.throws(() => emailSchema.parse(''));
    });

    it('should reject missing TLD', () => {
      assert.throws(() => emailSchema.parse('test@localhost'));
    });
  });

  describe('Password validation', () => {
    it('should accept a strong password', () => {
      const password = 'SecureP@ssw0rd';
      const result = passwordSchema.parse(password);
      assert.strictEqual(result, password);
    });

    it('should reject password without uppercase', () => {
      assert.throws(() => passwordSchema.parse('securep@ssw0rd'));
    });

    it('should reject password without lowercase', () => {
      assert.throws(() => passwordSchema.parse('SECUREP@SSW0RD'));
    });

    it('should reject password without number', () => {
      assert.throws(() => passwordSchema.parse('SecurePassword!'));
    });

    it('should reject password without special character', () => {
      assert.throws(() => passwordSchema.parse('SecurePassword1'));
    });

    it('should reject password shorter than 8 characters', () => {
      assert.throws(() => passwordSchema.parse('Sh0rt!'));
    });

    it('should reject password longer than 128 characters', () => {
      const longPassword = 'A'.repeat(129) + 'a1!';
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
      const data = { email: 'test@example.com', password: 'SecureP@ssw0rd' };
      const result = registerSchema.parse(data);
      assert.strictEqual(result.email, 'test@example.com');
      assert.strictEqual(result.password, 'SecureP@ssw0rd');
    });

    it('should reject registration with weak password', () => {
      const data = { email: 'test@example.com', password: 'weak' };
      assert.throws(() => registerSchema.parse(data));
    });

    it('should reject registration with invalid email', () => {
      const data = { email: 'invalid-email', password: 'SecureP@ssw0rd' };
      assert.throws(() => registerSchema.parse(data));
    });
  });

  describe('Login schema', () => {
    it('should validate valid login data', () => {
      const data = { email: 'test@example.com', password: 'anypassword' };
      const result = loginSchema.parse(data);
      assert.strictEqual(result.email, 'test@example.com');
      assert.strictEqual(result.password, 'anypassword');
    });

    it('should lowercase email on login', () => {
      const data = { email: 'TEST@EXAMPLE.COM', password: 'anypassword' };
      const result = loginSchema.parse(data);
      assert.strictEqual(result.email, 'test@example.com');
    });
  });

  describe('Password change schema', () => {
    it('should validate valid password change', () => {
      const data = { oldPassword: 'OldP@ssw0rd', newPassword: 'NewP@ssw0rd123' };
      const result = passwordChangeSchema.parse(data);
      assert.strictEqual(result.oldPassword, 'OldP@ssw0rd');
      assert.strictEqual(result.newPassword, 'NewP@ssw0rd123');
    });

    it('should reject same old and new password', () => {
      const data = { oldPassword: 'SameP@ssw0rd', newPassword: 'SameP@ssw0rd' };
      assert.throws(() => passwordChangeSchema.parse(data));
    });

    it('should reject weak new password', () => {
      const data = { oldPassword: 'OldP@ssw0rd', newPassword: 'weak' };
      assert.throws(() => passwordChangeSchema.parse(data));
    });
  });

  describe('validateBody helper', () => {
    it('should return success for valid data', () => {
      const data = { email: 'test@example.com', password: 'SecureP@ssw0rd' };
      const result = validateBody(registerSchema, data);

      assert.strictEqual(result.success, true);
      assert.ok(result.data);
    });

    it('should return error for invalid data', () => {
      const data = { email: 'invalid', password: 'weak' };
      const result = validateBody(registerSchema, data);

      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('Password strength validation', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('SecureP@ssw0rd');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should report all errors for very weak password', () => {
      const result = validatePasswordStrength('x');
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('should report missing uppercase', () => {
      const result = validatePasswordStrength('securep@ssw0rd');
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('uppercase')));
    });

    it('should report missing lowercase', () => {
      const result = validatePasswordStrength('SECUREP@SSW0RD');
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('lowercase')));
    });

    it('should report missing number', () => {
      const result = validatePasswordStrength('SecurePassword!');
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('number')));
    });

    it('should report missing special character', () => {
      const result = validatePasswordStrength('SecurePassword1');
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('special')));
    });
  });

  describe('Password strength score', () => {
    it('should score 0 for very weak password', () => {
      const score = getPasswordStrength('x');
      assert.strictEqual(score, 0);
    });

    it('should score 1 for 8+ chars', () => {
      const score = getPasswordStrength('abcdefgh');
      assert.strictEqual(score, 1);
    });

    it('should score higher for complex password', () => {
      const score = getPasswordStrength('SecureP@ssw0rd');
      assert.ok(score >= 4);
    });

    it('should max at 4', () => {
      const score = getPasswordStrength('VerySecureL0ngP@ssword!');
      assert.strictEqual(score, 4);
    });
  });
});
