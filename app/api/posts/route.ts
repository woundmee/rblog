import { NextResponse } from "next/server";
import { createPost, getPostsMetaPage } from "@/lib/posts";
import { isAdminRequest, isTrustedMutationOrigin } from "@/lib/auth";

export const runtime = "nodejs";

type Payload = {
  title?: string;
  excerpt?: string;
  date?: string;
  markdown?: string;
  tags?: string[];
};

const readSearchParam = (params: URLSearchParams, key: string): string => params.get(key)?.trim() ?? "";

const readPositiveInt = (value: string, fallback: number): number => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = readSearchParam(url.searchParams, "q");
  const page = readPositiveInt(readSearchParam(url.searchParams, "page"), 1);
  const pageSize = readPositiveInt(readSearchParam(url.searchParams, "pageSize"), 30);

  try {
    const result = await getPostsMetaPage({
      q: q || undefined,
      page,
      pageSize
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить список статей." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

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
