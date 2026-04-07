import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isTrustedMutationOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0
  });
  return response;
}
