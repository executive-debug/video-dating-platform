import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVerificationProvider } from "@/lib/verification";
import { VerificationNotConfiguredError } from "@/lib/verification/provider";

export async function POST(req: Request) {
  const rawBody = await req.text();
  try {
    const result = await getVerificationProvider().handleWebhook({
      rawBody,
      headers: req.headers,
    });
    await db.user.updateMany({
      where: { verificationRef: result.providerRef },
      data: { verificationStatus: result.status },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof VerificationNotConfiguredError) {
      return NextResponse.json({ ok: false, error: "not_configured" }, { status: 501 });
    }
    return NextResponse.json({ ok: false, error: "invalid_webhook" }, { status: 400 });
  }
}
