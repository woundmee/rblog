import crypto from "node:crypto";
import path from "node:path";

export const uploadsImagesDir = path.join(process.cwd(), "uploads", "images");
export const maxUploadImageBytes = 8 * 1024 * 1024;

const mimeToExtension = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif"
} as const;

type SupportedImageMime = keyof typeof mimeToExtension;
type SupportedImageExtension = (typeof mimeToExtension)[SupportedImageMime];

const extensionToMime: Record<string, SupportedImageMime> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif"
};

const sanitizeNamePart = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export const inferImageExtension = (fileName: string, mimeType: string): string | null => {
  const normalizedMime = mimeType.trim().toLowerCase();
  const byMime = normalizedMime in mimeToExtension ? mimeToExtension[normalizedMime as SupportedImageMime] : undefined;
  if (byMime) {
    return byMime;
  }
  const ext = path.extname(fileName).toLowerCase();
  if (extensionToMime[ext]) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return null;
};

export const buildStoredImageName = (fileName: string, extension: string): string => {
  const base = sanitizeNamePart(path.basename(fileName, path.extname(fileName))) || "image";
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  return `${Date.now()}-${base}-${random}${extension}`;
};

const startsWithBytes = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((value, index) => bytes[index] === value);

const readAscii = (bytes: Uint8Array, start: number, end: number): string => {
  if (start < 0 || end > bytes.length || start >= end) {
    return "";
  }
  return String.fromCharCode(...bytes.slice(start, end));
};

export const detectImageTypeByMagicBytes = (
  bytes: Uint8Array
): { mime: SupportedImageMime; extension: SupportedImageExtension } | null => {
  if (bytes.length < 12) {
    return null;
  }

  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) {
    return { mime: "image/jpeg", extension: ".jpg" };
  }

  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", extension: ".png" };
  }

  const gifHeader = readAscii(bytes, 0, 6);
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") {
    return { mime: "image/gif", extension: ".gif" };
  }

  if (readAscii(bytes, 0, 4) === "RIFF" && readAscii(bytes, 8, 12) === "WEBP") {
    return { mime: "image/webp", extension: ".webp" };
  }

  if (readAscii(bytes, 4, 8) === "ftyp") {
    const brand = readAscii(bytes, 8, 12);
    if (brand === "avif" || brand === "avis") {
      return { mime: "image/avif", extension: ".avif" };
    }
  }

  return null;
};

export const getImageMimeByName = (fileName: string): string | null => {
  const ext = path.extname(fileName).toLowerCase();
  return extensionToMime[ext] ?? null;
};

export const isSafeStoredImageName = (value: string): boolean => /^[a-z0-9][a-z0-9._-]*$/i.test(value) && !value.includes("..");

export const resolveStoredImagePath = (fileName: string): string | null => {
  if (!isSafeStoredImageName(fileName)) {
    return null;
  }
  const resolved = path.resolve(uploadsImagesDir, fileName);
  const root = path.resolve(uploadsImagesDir);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    return null;
  }
  return resolved;
};

export const extractUploadedImageNames = (source: string): Set<string> => {
  const names = new Set<string>();
  const pattern = /\/uploads\/images\/([a-z0-9][a-z0-9._-]*)/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    let rawName = "";
    try {
      rawName = decodeURIComponent(match[1] ?? "").trim();
    } catch {
      rawName = (match[1] ?? "").trim();
    }
    if (isSafeStoredImageName(rawName)) {
      names.add(rawName);
    }
  }

  return names;
};
