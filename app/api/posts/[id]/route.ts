import { NextResponse } from "next/server";
import { deletePost, getPostById, updatePost } from "@/lib/posts";
import { isAdminRequest, isTrustedMutationOrigin } from "@/lib/auth";

export const runtime = "nodejs";

type Payload = {
  title?: string;
  excerpt?: string;
  date?: string;
  markdown?: string;
};

const parseId = (value: string): number => Number.parseInt(value, 10);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PUT(request: Request, { params }: RouteContext) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Payload;
    const title = body.title?.trim() ?? "";
    const excerpt = body.excerpt?.trim() ?? "";
    const markdown = body.markdown?.trim() ?? "";

    if (!title || !excerpt || !markdown) {
      return NextResponse.json({ error: "Не заполнены обязательные поля." }, { status: 400 });
    }

    const updated = await updatePost(id, {
      title,
      excerpt,
      date: body.date?.trim(),
      markdown
    });

    return NextResponse.json({ ok: true, slug: updated.slug });
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Post not found") {
      return NextResponse.json({ error: "Статья не найдена." }, { status: 404 });
    }
    return NextResponse.json({ error: "Не удалось обновить статью." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  try {
    const removed = await deletePost(id);
    if (!removed) {
      return NextResponse.json({ error: "Статья не найдена." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить статью." }, { status: 500 });
  }
}
