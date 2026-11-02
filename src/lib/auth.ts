import crypto from 'node:crypto';

export const ADMIN_COOKIE_NAME = 'soloq_admin_session';

export interface SessionPayload {
  role: string;
  exp: number; // Unix timestamp in ms
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Hashes inputs with SHA-256 first, ensuring uniform length and avoiding length leaks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Creates an HMAC-SHA256 signed session token for admin authentication.
 * Payload: { role: 'admin', exp: Date.now() + expiresInMs }
 */
export function createAdminSessionToken(expiresInMs = 24 * 60 * 60 * 1000): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not defined.');
  }

  const payload: SessionPayload = {
    role: 'admin',
    exp: Date.now() + expiresInMs,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies the HMAC-SHA256 signed session token.
 * Validates cryptographic signature, role, and expiration timestamp.
 */
export function verifyAdminSessionToken(token: string): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not defined.');
  }

  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [payloadBase64, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  if (!timingSafeCompare(signature, expectedSignature)) {
    return false;
  }

  try {
    const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr) as SessionPayload;

    if (payload.role !== 'admin') {
      return false;
    }

    if (!payload.exp || typeof payload.exp !== 'number') {
      return false;
    }

    if (Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// In-memory rate limiting for login attempts
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
}

const loginRateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(clientIp: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = loginRateLimitStore.get(clientIp);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  if (record.blockedUntil > 0 && record.blockedUntil <= now) {
    loginRateLimitStore.delete(clientIp);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  return { allowed: true, remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.attempts) };
}

export function recordFailedLoginAttempt(clientIp: string): {
  blocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = loginRateLimitStore.get(clientIp) || { attempts: 0, blockedUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    loginRateLimitStore.set(clientIp, record);
    return {
      blocked: true,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
    };
  }

  loginRateLimitStore.set(clientIp, record);
  return { blocked: false, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}

export function resetLoginRateLimit(clientIp: string): void {
  loginRateLimitStore.delete(clientIp);
}

export function _resetRateLimitStoreForTesting(): void {
  loginRateLimitStore.clear();
}

/**
 * Extracts client IP from headers, checking x-forwarded-for (from reverse proxy like Nginx)
 * with fallback to x-real-ip and finally a default IP.
 */
export function getClientIp(headersList: { get: (name: string) => string | null | undefined }): string {
  const xForwardedFor = headersList.get('x-forwarded-for');
  if (xForwardedFor) {
    const clientIp = xForwardedFor.split(',')[0].trim();
    if (clientIp) return clientIp;
  }
  const xRealIp = headersList.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return '127.0.0.1';
}
