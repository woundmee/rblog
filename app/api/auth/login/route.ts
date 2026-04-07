import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  clearLoginRateLimit,
  createAdminToken,
  getAdminConfigError,
  getAdminSessionTtlSeconds,
  getLoginRateLimitState,
  isTrustedMutationOrigin,
  isValidAdminCredentials,
  registerLoginFailure
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  try {
    const configError = getAdminConfigError();
    if (configError) {
      return NextResponse.json({ error: "Admin auth config is invalid." }, { status: 500 });
    }

    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";

    const limit = getLoginRateLimitState(request, username);
    if (limit.blocked) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later.", retryAfterSeconds: limit.retryAfterSeconds },
        { status: 429 }
      );
    }

    if (!isValidAdminCredentials(username, password)) {
      const failure = registerLoginFailure(request, username);
      if (failure.blocked) {
        return NextResponse.json(
          { error: "Too many attempts. Try again later.", retryAfterSeconds: failure.retryAfterSeconds },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    clearLoginRateLimit(request, username);

    const response = NextResponse.json({ ok: true });
    const maxAge = getAdminSessionTtlSeconds();
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: createAdminToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
