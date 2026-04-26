import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isServerActionsEnabled = (): boolean => process.env.NEXT_ALLOW_SERVER_ACTIONS === "1";

export function proxy(request: NextRequest) {
  if (!isServerActionsEnabled() && request.headers.has("next-action")) {
    return NextResponse.json(
      {
        error: "Server Actions are disabled for this deployment."
      },
      { status: 400 }
    );
  }

  return NextResponse.next();
}
