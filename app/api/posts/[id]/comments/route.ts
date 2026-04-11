import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isTrustedMutationOrigin } from "@/lib/auth";
import { getPostById } from "@/lib/posts";
import { createVisitorId, VISITOR_COOKIE_NAME } from "@/lib/visitor";
import {
  CommentAccessError,
  CommentNotFoundError,
  CommentRateLimitError,
  CommentValidationError,
  createPostComment,
  getPostComments,
  getVisitorAlias,
  updatePostComment
} from "@/lib/comments";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CommentPayload = {
  content?: string;
  parentId?: number | null;
};

type CommentUpdatePayload = {
  commentId?: number;
  content?: string;
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
  const comments = await getPostComments(id);
  const response = NextResponse.json({
    comments,
    me: getVisitorAlias(visitorId),
    meVisitorId: visitorId
  });

  return withVisitorCookie(response, visitorId, setCookie);
}

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

  const body = (await request.json().catch(() => ({}))) as CommentPayload;
  const { visitorId, setCookie } = await ensureVisitor();

  try {
    const comment = await createPostComment({
      postId: id,
      visitorId,
      content: body.content ?? "",
      parentId: typeof body.parentId === "number" ? body.parentId : null
    });

    const response = NextResponse.json({ ok: true, comment });
    return withVisitorCookie(response, visitorId, setCookie);
  } catch (error) {
    if (error instanceof CommentRateLimitError) {
      return NextResponse.json(
        {
          error: "Слишком часто. Подожди перед следующим комментарием.",
          retryAfterSeconds: error.retryAfterSeconds
        },
        { status: 429 }
      );
    }

    if (error instanceof CommentValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Не удалось отправить комментарий." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
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

  const body = (await request.json().catch(() => ({}))) as CommentUpdatePayload;
  const { visitorId, setCookie } = await ensureVisitor();
  const commentId = typeof body.commentId === "number" ? body.commentId : Number.NaN;

  if (!Number.isInteger(commentId) || commentId < 1) {
    return NextResponse.json({ error: "Некорректный комментарий." }, { status: 400 });
  }

  try {
    const comment = await updatePostComment({
      postId: id,
      commentId,
      visitorId,
      content: body.content ?? ""
    });

    const response = NextResponse.json({ ok: true, comment });
    return withVisitorCookie(response, visitorId, setCookie);
  } catch (error) {
    if (error instanceof CommentAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof CommentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof CommentValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Не удалось обновить комментарий." }, { status: 500 });
  }
}
