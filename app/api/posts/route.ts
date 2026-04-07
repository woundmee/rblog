import { NextResponse } from "next/server";
import { createPost } from "@/lib/posts";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";

type Payload = {
  title?: string;
  excerpt?: string;
  date?: string;
  markdown?: string;
  tags?: string[];
};

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Payload;
    const title = body.title?.trim() ?? "";
    const excerpt = body.excerpt?.trim() ?? "";
    const markdown = body.markdown?.trim() ?? "";

    if (!title || !excerpt || !markdown) {
      return NextResponse.json({ error: "Не заполнены обязательные поля." }, { status: 400 });
    }

    const created = await createPost({
      title,
      excerpt,
      date: body.date?.trim(),
      markdown,
      tags: body.tags
    });

    return NextResponse.json({ ok: true, slug: created.slug, id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка публикации статьи." }, { status: 500 });
  }
}
