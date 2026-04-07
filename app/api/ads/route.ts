import { NextResponse } from "next/server";
import { isAdminRequest, isTrustedMutationOrigin } from "@/lib/auth";
import { updateAdContent } from "@/lib/site-content";

export const runtime = "nodejs";

type Payload = {
  enabled?: boolean;
  markdown?: string;
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
    const enabled = body.enabled === true;
    const markdown = body.markdown?.trim() ?? "";

    await updateAdContent({ enabled, markdown });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить рекламный блок." }, { status: 500 });
  }
}
