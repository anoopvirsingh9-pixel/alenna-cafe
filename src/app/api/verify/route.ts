import { NextRequest, NextResponse } from "next/server";
import { checkVerification, sendVerification } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const action = body.action as string;
    const destination = String(body.destination || "").trim();
    const channel = body.channel === "email" ? "email" : "sms";

    if (!destination) {
      return NextResponse.json({ error: "Phone or email is required." }, { status: 400 });
    }

    if (action === "send") {
      const code = await sendVerification(destination, channel);
      return NextResponse.json({
        success: true,
        preview: `Alenna Cafe Takanini: your verification code is ${code}. It expires in 10 minutes.`,
      });
    }

    if (action === "check") {
      const result = await checkVerification(destination, String(body.code || ""));
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed." },
      { status: 400 },
    );
  }
}
