import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdminRequest, isTrustedMutationOrigin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { extractUploadedImageNames, isSafeStoredImageName, uploadsImagesDir } from "@/lib/upload-images";

export const runtime = "nodejs";

type PostMarkdownRow = {
  content: string;
};

type SiteContentRow = {
  section_key: string;
  section_value: string;
};

const collectReferencedImages = (): Set<string> => {
  const db = getDb();
  const referenced = new Set<string>();

  const posts = db.prepare("SELECT content FROM posts").all() as PostMarkdownRow[];
  for (const post of posts) {
    for (const name of extractUploadedImageNames(post.content ?? "")) {
      referenced.add(name);
    }
  }

  const siteContent = db
    .prepare("SELECT section_key, section_value FROM site_content WHERE section_key IN ('about', 'who_i_am', 'ad_markdown')")
    .all() as SiteContentRow[];
  for (const row of siteContent) {
    for (const name of extractUploadedImageNames(row.section_value ?? "")) {
      referenced.add(name);
    }
  }

  return referenced;
};

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await fs.mkdir(uploadsImagesDir, { recursive: true });
    const entries = await fs.readdir(uploadsImagesDir, { withFileTypes: true });
    const referenced = collectReferencedImages();

    const allStoredFiles = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => name !== ".gitkeep" && isSafeStoredImageName(name));

    const deletable = allStoredFiles.filter((name) => !referenced.has(name));

    let deletedCount = 0;
    const deletedNames: string[] = [];

    for (const name of deletable) {
      const filePath = path.join(uploadsImagesDir, name);
      try {
        await fs.unlink(filePath);
        deletedCount += 1;
        deletedNames.push(name);
      } catch {
        // Skip individual file errors to continue cleanup.
      }
    }

    return NextResponse.json({
      ok: true,
      totalStored: allStoredFiles.length,
      referenced: referenced.size,
      removed: deletedCount,
      remaining: allStoredFiles.length - deletedCount,
      removedNames: deletedNames
    });
  } catch {
    return NextResponse.json({ error: "Не удалось очистить неиспользуемые изображения." }, { status: 500 });
  }
}
