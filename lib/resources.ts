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

type ResourceClickTotalsRow = {
  total_clicks: number | bigint;
  unique_visitors: number | bigint;
  with_utm: number | bigint;
};

type ResourceClicksTopRow = {
  id: number;
  title: string;
  url: string;
  clicks: number | bigint;
};

type ResourceUtmBucketRow = {
  value: string | null;
  clicks: number | bigint;
};

type ResourceDailyClickRow = {
  day: string;
  clicks: number | bigint;
};

type ResourceLatestClickRow = {
  clicked_at: string;
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

export type ResourceClickTrackInput = {
  resourceId: number;
  visitorId: string;
  pagePath?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
};

type ResourceAnalyticsBucket = {
  value: string;
  clicks: number;
};

export type ResourceClickAnalytics = {
  totals: {
    totalClicks: number;
    uniqueVisitors: number;
    withUtm: number;
  };
  topResources: Array<{
    id: number;
    title: string;
    url: string;
    clicks: number;
  }>;
  utm: {
    sources: ResourceAnalyticsBucket[];
    mediums: ResourceAnalyticsBucket[];
    campaigns: ResourceAnalyticsBucket[];
  };
  daily: Array<{ day: string; clicks: number }>;
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

const normalizeShortText = (value: string | null | undefined, maxLength: number): string | null => {
  const normalized = collapseWhitespace(value ?? "");
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, maxLength);
};

const normalizeUtmValue = (value: string | null | undefined): string | null => normalizeShortText(value, 120)?.toLowerCase() ?? null;

const normalizePagePath = (value: string | null | undefined): string => {
  const normalized = collapseWhitespace(value ?? "");
  if (!normalized) {
    return "";
  }
  return normalized.slice(0, 260);
};

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

export const trackResourceClick = async (input: ResourceClickTrackInput): Promise<void> => {
  const db = getDb();
  const visitorId = normalizeShortText(input.visitorId, 80);
  if (!visitorId) {
    return;
  }

  const latest = db
    .prepare("SELECT clicked_at FROM resource_clicks WHERE resource_id = ? AND visitor_id = ? ORDER BY clicked_at DESC LIMIT 1")
    .get(input.resourceId, visitorId) as ResourceLatestClickRow | undefined;

  if (latest?.clicked_at) {
    const latestTs = Date.parse(latest.clicked_at);
    if (Number.isFinite(latestTs) && Date.now() - latestTs < 1500) {
      return;
    }
  }

  db.prepare(
    `
      INSERT INTO resource_clicks (
        resource_id,
        visitor_id,
        clicked_at,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        page_path
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    input.resourceId,
    visitorId,
    new Date().toISOString(),
    normalizeUtmValue(input.utmSource),
    normalizeUtmValue(input.utmMedium),
    normalizeUtmValue(input.utmCampaign),
    normalizeUtmValue(input.utmTerm),
    normalizeUtmValue(input.utmContent),
    normalizePagePath(input.pagePath)
  );
};

const fetchUtmBuckets = (field: "utm_source" | "utm_medium" | "utm_campaign"): ResourceAnalyticsBucket[] => {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT ${field} as value, COUNT(*) as clicks
        FROM resource_clicks
        WHERE ${field} IS NOT NULL AND TRIM(${field}) <> ''
        GROUP BY ${field}
        ORDER BY clicks DESC, value ASC
        LIMIT 8
      `
    )
    .all() as ResourceUtmBucketRow[];

  return rows.map((row) => ({
    value: row.value ?? "",
    clicks: toNumber(row.clicks)
  }));
};

export const getResourceClickAnalytics = async (): Promise<ResourceClickAnalytics> => {
  noStore();
  const db = getDb();

  const totals = db
    .prepare(
      `
        SELECT
          COUNT(*) as total_clicks,
          COUNT(DISTINCT visitor_id) as unique_visitors,
          SUM(
            CASE
              WHEN
                (utm_source IS NOT NULL AND TRIM(utm_source) <> '')
                OR (utm_medium IS NOT NULL AND TRIM(utm_medium) <> '')
                OR (utm_campaign IS NOT NULL AND TRIM(utm_campaign) <> '')
                OR (utm_term IS NOT NULL AND TRIM(utm_term) <> '')
                OR (utm_content IS NOT NULL AND TRIM(utm_content) <> '')
              THEN 1
              ELSE 0
            END
          ) as with_utm
        FROM resource_clicks
      `
    )
    .get() as ResourceClickTotalsRow;

  const topResourcesRows = db
    .prepare(
      `
        SELECT r.id, r.title, r.url, COUNT(c.id) as clicks
        FROM resource_clicks c
        JOIN resources r ON r.id = c.resource_id
        GROUP BY r.id
        ORDER BY clicks DESC, r.updated_at DESC
        LIMIT 8
      `
    )
    .all() as ResourceClicksTopRow[];

  const dailyRows = db
    .prepare(
      `
        SELECT substr(clicked_at, 1, 10) as day, COUNT(*) as clicks
        FROM resource_clicks
        WHERE clicked_at >= datetime('now', '-14 day')
        GROUP BY day
        ORDER BY day ASC
      `
    )
    .all() as ResourceDailyClickRow[];

  return {
    totals: {
      totalClicks: toNumber(totals.total_clicks ?? 0),
      uniqueVisitors: toNumber(totals.unique_visitors ?? 0),
      withUtm: toNumber(totals.with_utm ?? 0)
    },
    topResources: topResourcesRows.map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      clicks: toNumber(row.clicks)
    })),
    utm: {
      sources: fetchUtmBuckets("utm_source"),
      mediums: fetchUtmBuckets("utm_medium"),
      campaigns: fetchUtmBuckets("utm_campaign")
    },
    daily: dailyRows.map((row) => ({
      day: row.day,
      clicks: toNumber(row.clicks)
    }))
  };
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
