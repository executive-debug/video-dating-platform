import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitStep } from "@/lib/onboarding/service";
import { parseStepParam } from "@/lib/onboarding/steps";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ step: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  // JSON-only: a cross-site HTML form cannot send this content type (CSRF defence in depth).
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "unsupported_media_type" }, { status: 400 });
  }

  const step = parseStepParam((await ctx.params).step);
  if (!step) return NextResponse.json({ ok: false, error: "invalid_step" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const result = await submitStep(session.user.id, step, body);
  return NextResponse.json(result.body, { status: result.status });
}
