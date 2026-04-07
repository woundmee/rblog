import dns from "node:dns/promises";
import net from "node:net";
import { unstable_noStore as noStore } from "next/cache";
import { getDb } from "@/lib/db";

type DbResourceRow = {
  id: number;
  url: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

type DbCountRow = {
  count: number | bigint;
};

type ResourceInsertResult = {
  lastInsertRowid: number | bigint;
};

type ResourceChangesResult = {
  changes: number;
};

type OpenGraphData = {
  title: string;
  description: string;
  imageUrl: string;
};

export type ResourceItem = {
  id: number;
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResources = {
  items: ResourceItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const toResourceItem = (row: DbResourceRow): ResourceItem => ({
  id: row.id,
  url: row.url,
  title: row.title,
  description: row.description,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const toNumber = (value: number | bigint): number => Number(value);

const collapseWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const normalizeText = (value: string): string => collapseWhitespace(decodeHtmlEntities(value));

const normalizeUrl = (value: string): string => {
  const raw = value.trim();
  const parsed = new URL(raw);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Invalid resource URL");
  }
  parsed.hash = "";
  return parsed.toString();
};

const getDomainTitle = (resourceUrl: string): string => {
  try {
    const hostname = new URL(resourceUrl).hostname.replace(/^www\./i, "");
    return hostname || "Ресурс";
  } catch {
    return "Ресурс";
  }
};

const isLocalHostname = (hostname: string): boolean => {
  const value = hostname.toLowerCase();
  return value === "localhost" || value.endsWith(".localhost") || value.endsWith(".local");
};

const isPrivateIpv4 = (address: string): boolean => {
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127)
  );
};

const isPrivateIpv6 = (address: string): boolean => {
  const value = address.toLowerCase();
  return value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:");
};

const isPrivateIpAddress = (address: string): boolean => {
  const version = net.isIP(address);
  if (version === 4) {
    return isPrivateIpv4(address);
  }
  if (version === 6) {
    return isPrivateIpv6(address);
  }
  return false;
};

const assertPublicUrlHost = async (resourceUrl: string): Promise<void> => {
  const hostname = new URL(resourceUrl).hostname;
  if (isLocalHostname(hostname)) {
    throw new Error("Forbidden resource host");
  }

  if (net.isIP(hostname) > 0) {
    if (isPrivateIpAddress(hostname)) {
      throw new Error("Forbidden resource host");
    }
    return;
  }

  try {
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    if (records.some((record) => isPrivateIpAddress(record.address))) {
      throw new Error("Forbidden resource host");
    }
  } catch (error) {
    if ((error as Error).message === "Forbidden resource host") {
      throw error;
    }
    // DNS lookup errors are treated as "unknown host" and handled by fetch below.
  }
};

const parseMetaTags = (html: string): Array<Record<string, string>> => {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  return metaTags.map((tag) => {
    const attrs: Record<string, string> = {};
    const matches = tag.matchAll(/([a-zA-Z:-]+)\s*=\s*(["'])(.*?)\2/g);
    for (const match of matches) {
      const key = match[1]?.toLowerCase();
      const value = match[3] ?? "";
      if (key) {
        attrs[key] = value;
      }
    }
    return attrs;
  });
};

const pickMetaContent = (metaTags: Array<Record<string, string>>, names: string[]): string => {
  const expected = new Set(names.map((name) => name.toLowerCase()));

  for (const attrs of metaTags) {
    const key = (attrs.property ?? attrs.name ?? "").toLowerCase();
    if (!expected.has(key)) {
      continue;
    }
    const content = normalizeText(attrs.content ?? "");
    if (content) {
      return content;
    }
  }

  return "";
};

const extractTitleTag = (html: string): string => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) {
    return "";
  }
  return normalizeText(match[1]);
};

const toAbsoluteUrl = (value: string, baseUrl: string): string => {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
};

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;

const fetchSafeHtml = async (
  resourceUrl: string,
  signal: AbortSignal
): Promise<{ html: string; finalUrl: string } | null> => {
  let currentUrl = resourceUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublicUrlHost(currentUrl);

    const response = await fetch(currentUrl, {
      signal,
      redirect: "manual",
      headers: {
        "user-agent": "rblog-resource-bot/1.0 (+https://rblog.local)",
        accept: "text/html,application/xhtml+xml"
      }
    });

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        return null;
      }

      const nextUrl = toAbsoluteUrl(location, currentUrl);
      if (!nextUrl) {
        return null;
      }

      const parsedNext = new URL(nextUrl);
      if (!["http:", "https:"].includes(parsedNext.protocol)) {
        throw new Error("Invalid resource URL");
      }

      currentUrl = parsedNext.toString();
      continue;
    }

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return null;
    }

    const html = await response.text();
    return {
      html,
      finalUrl: currentUrl
    };
  }

  throw new Error("Too many redirects");
};

const fetchOpenGraphData = async (resourceUrl: string): Promise<OpenGraphData> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const fetched = await fetchSafeHtml(resourceUrl, controller.signal);
    if (!fetched) {
      return { title: "", description: "", imageUrl: "" };
    }

    const html = fetched.html;
    const metaTags = parseMetaTags(html);

    const title =
      pickMetaContent(metaTags, ["og:title", "twitter:title", "title"]) ||
      extractTitleTag(html) ||
      getDomainTitle(resourceUrl);

    const description = pickMetaContent(metaTags, ["og:description", "twitter:description", "description"]);

    const rawImage = pickMetaContent(metaTags, ["og:image", "twitter:image", "og:image:url"]);
    const imageUrl = rawImage ? toAbsoluteUrl(rawImage, fetched.finalUrl || resourceUrl) : "";

    return {
      title,
      description,
      imageUrl
    };
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Forbidden resource host" || message === "Invalid resource URL" || message === "Too many redirects") {
      throw error;
    }
    return { title: "", description: "", imageUrl: "" };
  } finally {
    clearTimeout(timeout);
  }
};

export const getAllResources = async (filters?: { q?: string }): Promise<ResourceItem[]> => {
  noStore();
  const db = getDb();
  const normalizedQuery = filters?.q?.trim().toLocaleLowerCase("ru-RU") ?? "";
  const params: unknown[] = [];
  const whereSql =
    normalizedQuery.length > 0
      ? (() => {
          params.push(`%${normalizedQuery}%`);
          return "WHERE LOWER(title) LIKE ?";
        })()
      : "";
  const rows = db
    .prepare(`SELECT * FROM resources ${whereSql} ORDER BY updated_at DESC, id DESC`)
    .all(...params) as DbResourceRow[];
  return rows.map(toResourceItem);
};

export const getResourcesPage = async (options?: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResources> => {
  noStore();
  const db = getDb();
  const page = Math.max(1, Math.floor(options?.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(options?.pageSize ?? 40)));
  const offset = (page - 1) * pageSize;
  const normalizedQuery = options?.q?.trim().toLocaleLowerCase("ru-RU") ?? "";
  const params: unknown[] = [];
  const whereSql =
    normalizedQuery.length > 0
      ? (() => {
          params.push(`%${normalizedQuery}%`);
          return "WHERE LOWER(title) LIKE ?";
        })()
      : "";

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM resources ${whereSql}`).get(...params) as DbCountRow;
  const total = toNumber(totalRow.count);
  const rows = db
    .prepare(
      `
        SELECT *
        FROM resources
        ${whereSql}
        ORDER BY updated_at DESC, id DESC
        LIMIT ? OFFSET ?
      `
    )
    .all(...params, pageSize, offset) as DbResourceRow[];

  return {
    items: rows.map(toResourceItem),
    total,
    page,
    pageSize,
    hasMore: offset + rows.length < total
  };
};

export const getAdminResourcesPage = async (options?: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResources> =>
  getResourcesPage({
    q: options?.q,
    page: options?.page,
    pageSize: options?.pageSize ?? 20
  });

export const getResourceById = async (id: number): Promise<ResourceItem | null> => {
  noStore();
  const db = getDb();
  const row = db.prepare("SELECT * FROM resources WHERE id = ? LIMIT 1").get(id) as DbResourceRow | undefined;
  return row ? toResourceItem(row) : null;
};

export const createResource = async (input: {
  url: string;
  title?: string;
  description?: string;
}): Promise<ResourceItem> => {
  const db = getDb();
  const now = new Date().toISOString();
  const url = normalizeUrl(input.url);

  const openGraph = await fetchOpenGraphData(url);
  const title = collapseWhitespace(input.title?.trim() ?? "");
  if (!title) {
    throw new Error("Resource title required");
  }
  const description = collapseWhitespace(input.description?.trim() ?? "") || openGraph.description || "";
  const imageUrl = openGraph.imageUrl || "";

  const result = db
    .prepare(
      `
        INSERT INTO resources (url, title, description, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(url, title, description, imageUrl, now, now) as ResourceInsertResult;

  const createdId = Number(result.lastInsertRowid);
  const created = db.prepare("SELECT * FROM resources WHERE id = ? LIMIT 1").get(createdId) as DbResourceRow | undefined;
  if (!created) {
    throw new Error("Resource creation failed");
  }

  return toResourceItem(created);
};

export const updateResource = async (
  id: number,
  input: {
    url: string;
    title?: string;
    description?: string;
  }
): Promise<ResourceItem> => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM resources WHERE id = ? LIMIT 1").get(id) as DbResourceRow | undefined;
  if (!existing) {
    throw new Error("Resource not found");
  }

  const now = new Date().toISOString();
  const url = normalizeUrl(input.url);

  const openGraph = await fetchOpenGraphData(url);
  const title = collapseWhitespace(input.title?.trim() ?? "");
  if (!title) {
    throw new Error("Resource title required");
  }
  const description = collapseWhitespace(input.description?.trim() ?? "") || openGraph.description || "";
  const imageUrl = openGraph.imageUrl || (url === existing.url ? existing.image_url : "");

  db.prepare(
    `
      UPDATE resources
      SET url = ?, title = ?, description = ?, image_url = ?, updated_at = ?
      WHERE id = ?
    `
  ).run(url, title, description, imageUrl, now, id);

  const updated = db.prepare("SELECT * FROM resources WHERE id = ? LIMIT 1").get(id) as DbResourceRow | undefined;
  if (!updated) {
    throw new Error("Resource update failed");
  }

  return toResourceItem(updated);
};

export const deleteResource = async (id: number): Promise<boolean> => {
  const db = getDb();
  const result = db.prepare("DELETE FROM resources WHERE id = ?").run(id) as ResourceChangesResult;
  return result.changes > 0;
};
