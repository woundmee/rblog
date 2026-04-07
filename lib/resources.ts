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

const toResourceItem = (row: DbResourceRow): ResourceItem => ({
  id: row.id,
  url: row.url,
  title: row.title,
  description: row.description,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

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

const fetchOpenGraphData = async (resourceUrl: string): Promise<OpenGraphData> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(resourceUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "rblog-resource-bot/1.0 (+https://rblog.local)",
        accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return { title: "", description: "", imageUrl: "" };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return { title: "", description: "", imageUrl: "" };
    }

    const html = await response.text();
    const metaTags = parseMetaTags(html);

    const title =
      pickMetaContent(metaTags, ["og:title", "twitter:title", "title"]) ||
      extractTitleTag(html) ||
      getDomainTitle(resourceUrl);

    const description = pickMetaContent(metaTags, ["og:description", "twitter:description", "description"]);

    const rawImage = pickMetaContent(metaTags, ["og:image", "twitter:image", "og:image:url"]);
    const imageUrl = rawImage ? toAbsoluteUrl(rawImage, response.url || resourceUrl) : "";

    return {
      title,
      description,
      imageUrl
    };
  } catch {
    return { title: "", description: "", imageUrl: "" };
  } finally {
    clearTimeout(timeout);
  }
};

export const getAllResources = async (filters?: { q?: string }): Promise<ResourceItem[]> => {
  noStore();
  const db = getDb();
  const normalizedQuery = filters?.q?.trim().toLocaleLowerCase("ru-RU") ?? "";
  const rows = db.prepare("SELECT * FROM resources ORDER BY updated_at DESC, id DESC").all() as DbResourceRow[];
  const filteredRows =
    normalizedQuery.length > 0
      ? rows.filter((row) => row.title.toLocaleLowerCase("ru-RU").includes(normalizedQuery))
      : rows;
  return filteredRows.map(toResourceItem);
};

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
