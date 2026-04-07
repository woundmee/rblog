import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

export const ADMIN_COOKIE_NAME = "rblog_admin_session";

const isProduction = process.env.NODE_ENV === "production";

const PASSWORD_HASH_PREFIX = "scrypt";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 12;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const DEFAULT_RATE_LIMIT_LOCK_SECONDS = 15 * 60;
const DEFAULT_RATE_LIMIT_MAX_ATTEMPTS = 5;

const safeParseInt = (value: string | undefined, fallback: number, min: number, max: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
};

const getAdminUsername = (): string => {
  const username = process.env.ADMIN_USERNAME?.trim();
  if (username) {
    return username;
  }
  return isProduction ? "" : "admin";
};

const getAdminPasswordHash = (): string => process.env.ADMIN_PASSWORD_HASH?.trim() ?? "";

const getLegacyAdminPassword = (): string => process.env.ADMIN_PASSWORD ?? (isProduction ? "" : "change-me");

const getAdminSecret = (): string => {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (secret) {
    return secret;
  }
  return isProduction ? "" : "local-dev-secret";
};

export const getAdminSessionTtlSeconds = (): number =>
  safeParseInt(process.env.ADMIN_SESSION_TTL_SECONDS, DEFAULT_SESSION_TTL_SECONDS, 60, 60 * 60 * 24 * 30);

const getRateLimitWindowSeconds = (): number =>
  safeParseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_SECONDS, DEFAULT_RATE_LIMIT_WINDOW_SECONDS, 60, 60 * 60 * 24);

const getRateLimitLockSeconds = (): number =>
  safeParseInt(process.env.ADMIN_RATE_LIMIT_LOCK_SECONDS, DEFAULT_RATE_LIMIT_LOCK_SECONDS, 60, 60 * 60 * 24);

const getRateLimitMaxAttempts = (): number =>
  safeParseInt(process.env.ADMIN_RATE_LIMIT_MAX_ATTEMPTS, DEFAULT_RATE_LIMIT_MAX_ATTEMPTS, 2, 100);

const toBase64Url = (value: string): string => Buffer.from(value).toString("base64url");

const safeEqual = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
};

const sign = (payload: string): string => {
  const secret = getAdminSecret();
  if (!secret) {
    return "";
  }
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
};

const parseScryptHash = (value: string) => {
  const [prefix, nRaw, rRaw, pRaw, salt, digest] = value.split("$");
  if (prefix !== PASSWORD_HASH_PREFIX || !nRaw || !rRaw || !pRaw || !salt || !digest) {
    return null;
  }

  const N = Number.parseInt(nRaw, 10);
  const r = Number.parseInt(rRaw, 10);
  const p = Number.parseInt(pRaw, 10);

  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return null;
  }

  return { N, r, p, salt, digest };
};

const verifyPasswordHash = (password: string, encodedHash: string): boolean => {
  const parsed = parseScryptHash(encodedHash);
  if (!parsed) {
    return false;
  }

  try {
    const key = crypto.scryptSync(password, parsed.salt, 64, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
      maxmem: 64 * 1024 * 1024
    });
    const digest = key.toString("base64url");
    return safeEqual(digest, parsed.digest);
  } catch {
    return false;
  }
};

export const getAdminConfigError = (): string | null => {
  const username = process.env.ADMIN_USERNAME?.trim();
  const passwordHash = getAdminPasswordHash();
  const secret = process.env.ADMIN_SECRET?.trim();

  if (isProduction && !username) {
    return "ADMIN_USERNAME is required in production.";
  }

  if (isProduction && !passwordHash) {
    return "ADMIN_PASSWORD_HASH is required in production.";
  }

  if (passwordHash && !parseScryptHash(passwordHash)) {
    return "ADMIN_PASSWORD_HASH has invalid format. Expected scrypt$N$r$p$salt$digest.";
  }

  if (isProduction && !secret) {
    return "ADMIN_SECRET is required in production.";
  }

  if (isProduction && secret && secret.length < 32) {
    return "ADMIN_SECRET should be at least 32 characters.";
  }

  return null;
};

const isValidPassword = (password: string): boolean => {
  const passwordHash = getAdminPasswordHash();

  if (passwordHash) {
    return verifyPasswordHash(password, passwordHash);
  }

  if (isProduction) {
    return false;
  }

  const legacyPassword = getLegacyAdminPassword();
  return safeEqual(password, legacyPassword);
};

export const isValidAdminCredentials = (username: string, password: string): boolean => {
  const expectedUsername = getAdminUsername();
  if (!expectedUsername) {
    return false;
  }

  if (!safeEqual(username, expectedUsername)) {
    return false;
  }

  return isValidPassword(password);
};

export const createAdminToken = (): string => {
  const ttlSeconds = getAdminSessionTtlSeconds();
  const body = JSON.stringify({
    sub: getAdminUsername(),
    iat: Date.now(),
    exp: Date.now() + ttlSeconds * 1000
  });
  const payload = toBase64Url(body);
  const signature = sign(payload);
  return `${payload}.${signature}`;
};

export const verifyAdminToken = (token: string): boolean => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expected = sign(payload);
  if (!expected || !safeEqual(signature, expected)) {
    return false;
  }

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const body = JSON.parse(decoded) as { sub?: string; exp?: number };
    if (!body.sub || !safeEqual(body.sub, getAdminUsername())) {
      return false;
    }
    if (!body.exp || Date.now() > body.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const isAdminRequest = async (): Promise<boolean> => {
  if (getAdminConfigError()) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  return verifyAdminToken(token);
};

const getExpectedOrigin = (request: Request): string => {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return new URL(request.url).origin;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? new URL(request.url).protocol.replace(":", "");
  return `${protocol}://${host}`;
};

export const isTrustedMutationOrigin = (request: Request): boolean => {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const expectedOrigin = getExpectedOrigin(request);
  const origin = request.headers.get("origin");

  if (origin) {
    return origin === expectedOrigin;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return !isProduction;
};

type LoginAttemptRow = {
  key: string;
  fail_count: number;
  window_started_at: number;
  locked_until: number;
  updated_at: number;
};

type LoginRateLimitState = {
  blocked: boolean;
  retryAfterSeconds: number;
};

const getClientIp = (request: Request): string => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
};

const getRateLimitKeys = (request: Request, username: string): string[] => {
  const ip = getClientIp(request);
  const normalizedUser = username.trim().toLowerCase() || "_";
  return [`ip:${ip}`, `user:${normalizedUser}`, `combo:${ip}:${normalizedUser}`];
};

const loadAttempt = (key: string): LoginAttemptRow | null => {
  const db = getDb();
  const row = db
    .prepare("SELECT key, fail_count, window_started_at, locked_until, updated_at FROM admin_login_attempts WHERE key = ? LIMIT 1")
    .get(key) as LoginAttemptRow | undefined;

  return row ?? null;
};

const upsertAttempt = (row: LoginAttemptRow) => {
  const db = getDb();
  db.prepare(
    `
      INSERT INTO admin_login_attempts (key, fail_count, window_started_at, locked_until, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        fail_count = excluded.fail_count,
        window_started_at = excluded.window_started_at,
        locked_until = excluded.locked_until,
        updated_at = excluded.updated_at
    `
  ).run(row.key, row.fail_count, row.window_started_at, row.locked_until, row.updated_at);
};

const maybePruneOldAttempts = () => {
  const now = Date.now();
  const maxAgeMs = 1000 * 60 * 60 * 24 * 14;
  const db = getDb();
  db.prepare("DELETE FROM admin_login_attempts WHERE updated_at < ?").run(now - maxAgeMs);
};

export const getLoginRateLimitState = (request: Request, username: string): LoginRateLimitState => {
  maybePruneOldAttempts();

  const now = Date.now();
  const keys = getRateLimitKeys(request, username);
  let maxRetry = 0;

  for (const key of keys) {
    const row = loadAttempt(key);
    if (!row) {
      continue;
    }
    if (row.locked_until > now) {
      maxRetry = Math.max(maxRetry, Math.ceil((row.locked_until - now) / 1000));
    }
  }

  return {
    blocked: maxRetry > 0,
    retryAfterSeconds: maxRetry
  };
};

export const registerLoginFailure = (request: Request, username: string): LoginRateLimitState => {
  const now = Date.now();
  const windowMs = getRateLimitWindowSeconds() * 1000;
  const lockMs = getRateLimitLockSeconds() * 1000;
  const maxAttempts = getRateLimitMaxAttempts();

  const keys = getRateLimitKeys(request, username);
  let maxRetry = 0;

  for (const key of keys) {
    const previous = loadAttempt(key);

    const hasWindow = previous && now - previous.window_started_at <= windowMs;
    const failCount = hasWindow ? previous.fail_count + 1 : 1;
    const windowStartedAt = hasWindow && previous ? previous.window_started_at : now;

    const lockedUntil = failCount >= maxAttempts ? now + lockMs : 0;

    upsertAttempt({
      key,
      fail_count: failCount,
      window_started_at: windowStartedAt,
      locked_until: lockedUntil,
      updated_at: now
    });

    if (lockedUntil > now) {
      maxRetry = Math.max(maxRetry, Math.ceil((lockedUntil - now) / 1000));
    }
  }

  return {
    blocked: maxRetry > 0,
    retryAfterSeconds: maxRetry
  };
};

export const clearLoginRateLimit = (request: Request, username: string) => {
  const db = getDb();
  const keys = getRateLimitKeys(request, username);
  for (const key of keys) {
    db.prepare("DELETE FROM admin_login_attempts WHERE key = ?").run(key);
  }
};
