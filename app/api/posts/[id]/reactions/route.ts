import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPostById } from "@/lib/posts";
import { getPostReactions, upsertPostReaction } from "@/lib/engagement";
import { createVisitorId, VISITOR_COOKIE_NAME } from "@/lib/visitor";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ReactionPayload = {
  emoji?: string | null;
  rating?: number | null;
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

export async function GET(_: Request, { params }: RouteContext) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { visitorId, setCookie } = await ensureVisitor();
  const summary = await getPostReactions(id, visitorId);
  const response = NextResponse.json({ summary });

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
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as ReactionPayload;
  const { visitorId, setCookie } = await ensureVisitor();
  const summary = await upsertPostReaction(id, visitorId, body);
  const response = NextResponse.json({ ok: true, summary });

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
}
