import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { getImageMimeByName, resolveStoredImagePath } from "@/lib/upload-images";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ name: string }>;
};

const buildCacheHeaders = (contentType: string, contentLength?: number): HeadersInit => ({
  "Content-Type": contentType,
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
  ...(typeof contentLength === "number" ? { "Content-Length": String(contentLength) } : {})
});

export async function GET(_: Request, { params }: RouteContext) {
  const { name } = await params;
  const filePath = resolveStoredImagePath(name);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = getImageMimeByName(name);
  if (!contentType) {
    return new Response("Unsupported file", { status: 415 });
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return new Response("Not found", { status: 404 });
    }

    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>;

    return new Response(stream, {
      status: 200,
      headers: buildCacheHeaders(contentType, stat.size)
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function HEAD(_: Request, { params }: RouteContext) {
  const { name } = await params;
  const filePath = resolveStoredImagePath(name);
  const contentType = getImageMimeByName(name);
  if (!filePath || !contentType) {
    return new Response(null, { status: 404 });
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: buildCacheHeaders(contentType, stat.size)
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
