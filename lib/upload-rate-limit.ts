import crypto from "node:crypto";
import { getDb } from "@/lib/db";

type UploadLimitRow = {
  key: string;
  window_started_at: number;
  upload_count: number;
  uploaded_bytes: number;
  updated_at: number;
};

type UploadQuotaResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
      retryAfterSeconds: number;
    };

const DEFAULT_WINDOW_SECONDS = 10 * 60;
const DEFAULT_MAX_UPLOADS_PER_WINDOW = 12;
const DEFAULT_MAX_UPLOADS_PER_DAY = 120;
const DEFAULT_MAX_BYTES_PER_DAY = 256 * 1024 * 1024;
const LIMIT_ENTRY_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

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

const isTruthyEnv = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

const shouldTrustProxyHeaders = (): boolean => isTruthyEnv(process.env.TRUST_PROXY_HEADERS);

const firstHeaderValue = (value: string | null): string => value?.split(",")[0]?.trim() ?? "";

const getClientIp = (request: Request): string => {
  if (!shouldTrustProxyHeaders()) {
    return "unknown";
  }

  const cfConnectingIp = firstHeaderValue(request.headers.get("cf-connecting-ip"));
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const forwardedFor = firstHeaderValue(request.headers.get("x-forwarded-for"));
  if (forwardedFor) {
    return forwardedFor;
  }

  const realIp = firstHeaderValue(request.headers.get("x-real-ip"));
  if (realIp) {
    return realIp;
  }

  return "unknown";
};

const getUploadClientKey = (request: Request): string => {
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent")?.trim().toLowerCase() ?? "unknown";
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
};

const getWindowSeconds = (): number =>
  safeParseInt(process.env.ADMIN_UPLOAD_RATE_LIMIT_WINDOW_SECONDS, DEFAULT_WINDOW_SECONDS, 30, 60 * 60 * 24);

const getMaxUploadsPerWindow = (): number =>
  safeParseInt(process.env.ADMIN_UPLOAD_RATE_LIMIT_MAX_UPLOADS, DEFAULT_MAX_UPLOADS_PER_WINDOW, 1, 1000);

const getMaxUploadsPerDay = (): number =>
  safeParseInt(process.env.ADMIN_UPLOAD_RATE_LIMIT_MAX_UPLOADS_PER_DAY, DEFAULT_MAX_UPLOADS_PER_DAY, 1, 5000);

const getMaxBytesPerDay = (): number =>
  safeParseInt(process.env.ADMIN_UPLOAD_RATE_LIMIT_MAX_BYTES_PER_DAY, DEFAULT_MAX_BYTES_PER_DAY, 1024 * 1024, 1024 * 1024 * 1024 * 2);

const getDayCodeUtc = (timestampMs: number): string => new Date(timestampMs).toISOString().slice(0, 10);

const getNextUtcDayStartMs = (timestampMs: number): number => {
  const date = new Date(timestampMs);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0);
};

const loadLimitRow = (key: string): UploadLimitRow | null => {
  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT key, window_started_at, upload_count, uploaded_bytes, updated_at
        FROM admin_image_upload_limits
        WHERE key = ?
        LIMIT 1
      `
    )
    .get(key) as UploadLimitRow | undefined;

  return row ?? null;
};

const upsertLimitRow = (row: UploadLimitRow) => {
  const db = getDb();
  db.prepare(
    `
      INSERT INTO admin_image_upload_limits (key, window_started_at, upload_count, uploaded_bytes, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        window_started_at = excluded.window_started_at,
        upload_count = excluded.upload_count,
        uploaded_bytes = excluded.uploaded_bytes,
        updated_at = excluded.updated_at
    `
  ).run(row.key, row.window_started_at, row.upload_count, row.uploaded_bytes, row.updated_at);
};

const pruneOldLimitEntries = () => {
  const db = getDb();
  const minUpdatedAt = Date.now() - LIMIT_ENTRY_MAX_AGE_MS;
  db.prepare("DELETE FROM admin_image_upload_limits WHERE updated_at < ?").run(minUpdatedAt);
};

export const consumeImageUploadQuota = (request: Request, uploadBytes: number): UploadQuotaResult => {
  if (!Number.isFinite(uploadBytes) || uploadBytes <= 0) {
    return {
      ok: false,
      error: "Некорректный размер файла.",
      retryAfterSeconds: 1
    };
  }

  pruneOldLimitEntries();

  const db = getDb();
  const now = Date.now();
  const windowMs = getWindowSeconds() * 1000;
  const maxUploadsPerWindow = getMaxUploadsPerWindow();
  const maxUploadsPerDay = getMaxUploadsPerDay();
  const maxBytesPerDay = getMaxBytesPerDay();

  const clientKey = getUploadClientKey(request);
  const windowKey = `window:${clientKey}`;
  const dayCode = getDayCodeUtc(now);
  const dayKey = `day:${clientKey}:${dayCode}`;
  const nextUtcDayStart = getNextUtcDayStartMs(now);
  const nowDate = new Date(now);
  const dayStartUtc = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate(), 0, 0, 0, 0);

  const evaluate = db.transaction((): UploadQuotaResult => {
    const windowRow = loadLimitRow(windowKey);
    const inWindow = !!windowRow && now - windowRow.window_started_at < windowMs;
    const windowStartedAt = inWindow && windowRow ? windowRow.window_started_at : now;
    const windowCount = (inWindow && windowRow ? windowRow.upload_count : 0) + 1;
    const windowBytes = (inWindow && windowRow ? windowRow.uploaded_bytes : 0) + uploadBytes;

    if (windowCount > maxUploadsPerWindow) {
      const windowEndsAt = windowStartedAt + windowMs;
      return {
        ok: false,
        error: "Слишком много загрузок за короткое время. Попробуй позже.",
        retryAfterSeconds: Math.max(1, Math.ceil((windowEndsAt - now) / 1000))
      };
    }

    const dayRow = loadLimitRow(dayKey);
    const dayCount = (dayRow?.upload_count ?? 0) + 1;
    const dayBytes = (dayRow?.uploaded_bytes ?? 0) + uploadBytes;

    if (dayCount > maxUploadsPerDay || dayBytes > maxBytesPerDay) {
      return {
        ok: false,
        error: "Достигнут дневной лимит загрузок изображений.",
        retryAfterSeconds: Math.max(1, Math.ceil((nextUtcDayStart - now) / 1000))
      };
    }

    upsertLimitRow({
      key: windowKey,
      window_started_at: windowStartedAt,
      upload_count: windowCount,
      uploaded_bytes: windowBytes,
      updated_at: now
    });

    upsertLimitRow({
      key: dayKey,
      window_started_at: dayStartUtc,
      upload_count: dayCount,
      uploaded_bytes: dayBytes,
      updated_at: now
    });

    return { ok: true };
  });

  return evaluate();
};
