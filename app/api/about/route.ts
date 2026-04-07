import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { updateAboutContent } from "@/lib/site-content";

export const runtime = "nodejs";

type Payload = {
  about?: string;
  whoIAm?: string;
};

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Payload;
    const about = body.about?.trim() ?? "";
    const whoIAm = body.whoIAm?.trim() ?? "";

    await updateAboutContent({ about, whoIAm });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить раздел 'Обо мне'." }, { status: 500 });
  }
}
