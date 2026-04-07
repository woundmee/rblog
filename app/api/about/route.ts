import { NextResponse } from "next/server";
import { isAdminRequest, isTrustedMutationOrigin } from "@/lib/auth";
import { updateAboutContent } from "@/lib/site-content";

export const runtime = "nodejs";

type Payload = {
  aboutTitle?: string;
  whoIAmTitle?: string;
  about?: string;
  whoIAm?: string;
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
    const aboutTitle = body.aboutTitle?.trim() ?? "";
    const whoIAmTitle = body.whoIAmTitle?.trim() ?? "";
    const about = body.about?.trim() ?? "";
    const whoIAm = body.whoIAm?.trim() ?? "";

    await updateAboutContent({ aboutTitle, whoIAmTitle, about, whoIAm });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить раздел 'Обо мне'." }, { status: 500 });
  }
}
