import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { isAdminRequest, isTrustedMutationOrigin } from "@/lib/auth";
import { consumeImageUploadQuota } from "@/lib/upload-rate-limit";
import { buildStoredImageName, detectImageTypeByMagicBytes, maxUploadImageBytes, resolveStoredImagePath, uploadsImagesDir } from "@/lib/upload-images";

export const runtime = "nodejs";

const writeUploadedImage = async (bytes: Buffer, originalName: string, extension: string): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const storedName = buildStoredImageName(originalName, extension);
    const destinationPath = resolveStoredImagePath(storedName);
    if (!destinationPath) {
      continue;
    }

    try {
      await fs.writeFile(destinationPath, bytes, { flag: "wx" });
      return storedName;
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "EEXIST") {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to allocate upload file name");
};

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const payload = formData.get("file");

    if (!(payload instanceof File)) {
      return NextResponse.json({ error: "Файл не найден." }, { status: 400 });
    }

    if (payload.size <= 0) {
      return NextResponse.json({ error: "Файл пустой." }, { status: 400 });
    }

    if (payload.size > maxUploadImageBytes) {
      return NextResponse.json({ error: "Размер изображения не должен превышать 8 MB." }, { status: 400 });
    }

    const bytes = Buffer.from(await payload.arrayBuffer());
    const detected = detectImageTypeByMagicBytes(bytes);
    if (!detected) {
      return NextResponse.json({ error: "Поддерживаются только JPG, PNG, WEBP, GIF и AVIF." }, { status: 400 });
    }

    const quota = consumeImageUploadQuota(request, bytes.byteLength);
    if (!quota.ok) {
      return NextResponse.json(
        {
          error: quota.error,
          retryAfterSeconds: quota.retryAfterSeconds
        },
        { status: 429 }
      );
    }

    await fs.mkdir(uploadsImagesDir, { recursive: true });
    const storedName = await writeUploadedImage(bytes, payload.name, detected.extension);

    return NextResponse.json({
      ok: true,
      fileName: storedName,
      url: `/uploads/images/${storedName}`
    });
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить изображение." }, { status: 500 });
  }
}
