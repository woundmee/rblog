import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPostById } from "@/lib/posts";
import { recordPostView } from "@/lib/engagement";
import { isTrustedMutationOrigin } from "@/lib/auth";
import { createVisitorId, VISITOR_COOKIE_NAME } from "@/lib/visitor";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const parseId = (value: string): number => Number.parseInt(value, 10);

export async function POST(request: Request, { params }: RouteContext) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
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

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;

  const response = NextResponse.json({ ok: true });
  if (!visitorId) {
    visitorId = createVisitorId();
    response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  await recordPostView(id, visitorId);
  return response;
}
