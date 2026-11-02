import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  timingSafeCompare,
  createAdminSessionToken,
  verifyAdminSessionToken,
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginRateLimit,
  _resetRateLimitStoreForTesting,
  getClientIp,
} from './auth';

describe('auth helper', () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = 'test_session_secret_key_1234567890';
    _resetRateLimitStoreForTesting();
  });

  afterEach(() => {
    process.env.SESSION_SECRET = originalSecret;
    _resetRateLimitStoreForTesting();
  });

  describe('timingSafeCompare', () => {
    it('returns true for identical strings', () => {
      expect(timingSafeCompare('admin_password_123', 'admin_password_123')).toBe(true);
      expect(timingSafeCompare('', '')).toBe(true);
      expect(timingSafeCompare('tok_abc!@#$', 'tok_abc!@#$')).toBe(true);
    });

    it('returns false for different strings of same length', () => {
      expect(timingSafeCompare('password123', 'password124')).toBe(false);
    });

    it('returns false for strings of different lengths without throwing error', () => {
      expect(timingSafeCompare('short', 'a_much_longer_string_value')).toBe(false);
      expect(timingSafeCompare('a', 'abc')).toBe(false);
      expect(timingSafeCompare('', 'non-empty')).toBe(false);
    });

    it('returns false for non-string inputs', () => {
      // @ts-expect-error testing invalid type
      expect(timingSafeCompare(null, 'abc')).toBe(false);
      // @ts-expect-error testing invalid type
      expect(timingSafeCompare('abc', undefined)).toBe(false);
    });
  });

  describe('session tokens (HMAC-SHA256)', () => {
    it('creates and verifies a valid token', () => {
      const token = createAdminSessionToken(60 * 1000); // 1 minute
      expect(typeof token).toBe('string');
      expect(token).toContain('.');
      expect(verifyAdminSessionToken(token)).toBe(true);
    });

    it('fails when token signature is tampered with', () => {
      const token = createAdminSessionToken(60 * 1000);
      const [payload, sig] = token.split('.');
      const tamperedSig = sig.slice(0, -2) + (sig.endsWith('a') ? 'b' : 'a');
      const tamperedToken = `${payload}.${tamperedSig}`;

      expect(verifyAdminSessionToken(tamperedToken)).toBe(false);
    });

    it('fails when payload is tampered with', () => {
      const token = createAdminSessionToken(60 * 1000);
      const [, sig] = token.split('.');
      const alteredPayload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 999999 })).toString('base64url');
      const tamperedToken = `${alteredPayload}.${sig}`;

      expect(verifyAdminSessionToken(tamperedToken)).toBe(false);
    });

    it('fails when token is expired', () => {
      // Negative expiration creates an immediately expired token
      const expiredToken = createAdminSessionToken(-1000);
      expect(verifyAdminSessionToken(expiredToken)).toBe(false);
    });

    it('throws error when SESSION_SECRET is not defined', () => {
      delete process.env.SESSION_SECRET;
      expect(() => createAdminSessionToken()).toThrow('SESSION_SECRET environment variable is not defined.');
      expect(() => verifyAdminSessionToken('some.token')).toThrow('SESSION_SECRET environment variable is not defined.');
    });

    it('returns false for malformed token strings', () => {
      expect(verifyAdminSessionToken('')).toBe(false);
      expect(verifyAdminSessionToken('not-a-token')).toBe(false);
      expect(verifyAdminSessionToken('part1.part2.part3')).toBe(false);
    });
  });

  describe('login rate limiting and IP detection', () => {
    it('extracts IP from x-forwarded-for header with first IP priority', () => {
      const headers = new Map([['x-forwarded-for', '203.0.113.195, 70.41.3.18, 150.172.238.178']]);
      expect(getClientIp(headers)).toBe('203.0.113.195');
    });

    it('falls back to x-real-ip when x-forwarded-for is missing', () => {
      const headers = new Map([['x-real-ip', '198.51.100.42']]);
      expect(getClientIp(headers)).toBe('198.51.100.42');
    });

    it('falls back to default 127.0.0.1 when no proxy headers exist', () => {
      const headers = new Map();
      expect(getClientIp(headers)).toBe('127.0.0.1');
    });

    it('blocks after 5 failed attempts and resets on success', () => {
      const ip = '192.0.2.1';
      expect(checkLoginRateLimit(ip).allowed).toBe(true);

      for (let i = 1; i <= 4; i++) {
        const attempt = recordFailedLoginAttempt(ip);
        expect(attempt.blocked).toBe(false);
        expect(attempt.remainingAttempts).toBe(5 - i);
      }

      const fifthAttempt = recordFailedLoginAttempt(ip);
      expect(fifthAttempt.blocked).toBe(true);
      expect(fifthAttempt.remainingAttempts).toBe(0);

      const checkAfterBlock = checkLoginRateLimit(ip);
      expect(checkAfterBlock.allowed).toBe(false);
      expect(checkAfterBlock.retryAfterSeconds).toBeGreaterThan(0);

      resetLoginRateLimit(ip);
      expect(checkLoginRateLimit(ip).allowed).toBe(true);
    });
  });
});
