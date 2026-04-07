import { NextResponse } from "next/server";
import { deleteResource, updateResource } from "@/lib/resources";
import { isAdminRequest, isTrustedMutationOrigin } from "@/lib/auth";

export const runtime = "nodejs";

type Payload = {
  url?: string;
  title?: string;
  description?: string;
};

const parseId = (value: string): number => Number.parseInt(value, 10);

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    return NextResponse.json({ error: "Invalid resource id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Payload;
    const url = body.url?.trim() ?? "";
    const title = body.title?.trim() ?? "";

    if (!url) {
      return NextResponse.json({ error: "Укажи ссылку на ресурс." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Укажи заголовок ресурса." }, { status: 400 });
    }

    const resource = await updateResource(id, {
      url,
      title,
      description: body.description?.trim()
    });

    return NextResponse.json({ ok: true, resource });
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Invalid resource URL" || message === "Too many redirects") {
      return NextResponse.json({ error: "Некорректная ссылка. Используй http/https URL." }, { status: 400 });
    }
    if (message === "Forbidden resource host") {
      return NextResponse.json(
        { error: "Локальные и внутренние адреса запрещены. Используй публичный URL ресурса." },
        { status: 400 }
      );
    }
    if (message === "Resource not found") {
      return NextResponse.json({ error: "Ресурс не найден." }, { status: 404 });
    }
    if (message === "Resource title required") {
      return NextResponse.json({ error: "Укажи заголовок ресурса." }, { status: 400 });
    }
    if (message.includes("UNIQUE") || message.includes("unique")) {
      return NextResponse.json({ error: "Такой ресурс уже добавлен." }, { status: 409 });
    }
    return NextResponse.json({ error: "Не удалось обновить ресурс." }, { status: 500 });
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
    return NextResponse.json({ error: "Invalid resource id" }, { status: 400 });
  }

  try {
    const deleted = await deleteResource(id);
    if (!deleted) {
      return NextResponse.json({ error: "Ресурс не найден." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось удалить ресурс." }, { status: 500 });
  }
}
