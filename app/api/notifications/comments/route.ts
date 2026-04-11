import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isTrustedMutationOrigin } from "@/lib/auth";
import { createVisitorId, VISITOR_COOKIE_NAME } from "@/lib/visitor";
import { getCommentNotifications, markCommentNotificationsRead } from "@/lib/comments";

export const runtime = "nodejs";

type MarkReadPayload = {
  commentIds?: number[];
  markAll?: boolean;
};

const ensureVisitor = async () => {
  const cookieStore = await cookies();
  const existing = cookieStore.get(VISITOR_COOKIE_NAME)?.value;
  if (existing) {
    return { visitorId: existing, setCookie: false };
  }
  return { visitorId: createVisitorId(), setCookie: true };
};

const withVisitorCookie = <T>(response: NextResponse<T>, visitorId: string, setCookie: boolean): NextResponse<T> => {
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
};

export async function GET() {
  const { visitorId, setCookie } = await ensureVisitor();
  const notifications = await getCommentNotifications(visitorId);
  const response = NextResponse.json(notifications);
  return withVisitorCookie(response, visitorId, setCookie);
}

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const { visitorId, setCookie } = await ensureVisitor();
  const body = (await request.json().catch(() => ({}))) as MarkReadPayload;
  const all = await getCommentNotifications(visitorId);

  const ids = body.markAll
    ? all.items.map((item) => item.id)
    : Array.isArray(body.commentIds)
      ? body.commentIds.filter((id) => Number.isInteger(id) && id > 0)
      : [];

  await markCommentNotificationsRead(visitorId, ids);
  const next = await getCommentNotifications(visitorId);
  const response = NextResponse.json({ ok: true, ...next });
  return withVisitorCookie(response, visitorId, setCookie);
}
