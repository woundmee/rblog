import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isTrustedMutationOrigin } from "@/lib/auth";
import { getResourceById, trackResourceClick } from "@/lib/resources";
import { createVisitorId, VISITOR_COOKIE_NAME } from "@/lib/visitor";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ClickPayload = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  pagePath?: string | null;
};

const parseId = (value: string): number => Number.parseInt(value, 10);

const ensureVisitor = async () => {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE_NAME)?.value;
  if (existing) {
    return { visitorId: existing, setCookie: false };
  }
  return { visitorId: createVisitorId(), setCookie: true };
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid resource id" }, { status: 400 });
  }

  const resource = await getResourceById(id);
  if (!resource) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as ClickPayload;
    const { visitorId, setCookie } = await ensureVisitor();

    await trackResourceClick({
      resourceId: id,
      visitorId,
      pagePath: body.pagePath ?? undefined,
      utmSource: body.utmSource ?? undefined,
      utmMedium: body.utmMedium ?? undefined,
      utmCampaign: body.utmCampaign ?? undefined,
      utmTerm: body.utmTerm ?? undefined,
      utmContent: body.utmContent ?? undefined
    });

    const response = NextResponse.json({ ok: true });
    if (setCookie) {
      response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить клик." }, { status: 500 });
  }
}
