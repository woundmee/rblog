import { NextResponse } from "next/server";
import { createResource } from "@/lib/resources";
import { isAdminRequest, isTrustedMutationOrigin } from "@/lib/auth";

export const runtime = "nodejs";

type Payload = {
  url?: string;
  title?: string;
  description?: string;
};

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const resource = await createResource({
      url,
      title,
      description: body.description?.trim()
    });

    return NextResponse.json({ ok: true, resource }, { status: 201 });
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
    if (message === "Resource title required") {
      return NextResponse.json({ error: "Укажи заголовок ресурса." }, { status: 400 });
    }
    if (message.includes("UNIQUE") || message.includes("unique")) {
      return NextResponse.json({ error: "Такой ресурс уже добавлен." }, { status: 409 });
    }
    return NextResponse.json({ error: "Не удалось создать ресурс." }, { status: 500 });
  }
}
