import { NextRequest, NextResponse } from "next/server";
import { checkVerification, sendVerification } from "@/lib/store";
import { ensureSeeded } from "@/lib/seed";
import { validateEmail, validatePhone } from "@/lib/validate";

export const dynamic = "force-dynamic";

/** Send a real email via Resend (only if RESEND_API_KEY is configured). */
async function sendRealEmail(to: string, subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.EMAIL_FROM || "Alenna Cafe <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Send a real SMS via Twilio (only if Twilio env vars are configured). */
async function sendRealSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return false;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const action = body.action as string;
    const channel = body.channel === "email" ? "email" : "sms";

    let destination = String(body.destination || "").trim();
    if (!destination) {
      return NextResponse.json({ error: "Phone or email is required." }, { status: 400 });
    }

    // Proper validation — no more "gmail.co" slipping through.
    if (channel === "email") {
      const check = validateEmail(destination);
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
      destination = check.email;
    } else {
      const check = validatePhone(destination);
      if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
      destination = check.phone;
    }

    if (action === "send") {
      const code = await sendVerification(destination, channel);

      if (channel === "email") {
        const message = `Kia ora! Your Alenna Cafe verification code is ${code}. It expires in 10 minutes. See you soon — 9/226 Great South Road, Takanini.`;
        const sent = await sendRealEmail(destination, "Your Alenna Cafe verification code", message);
        return NextResponse.json({
          success: true,
          sentForReal: sent,
          preview: sent
            ? `We emailed your code to ${destination} — check your inbox (and spam folder). It expires in 10 minutes.`
            : `Your verification code is ${code}. It expires in 10 minutes.`,
        });
      }

      const message = `Alenna Cafe Takanini: your verification code is ${code}. It expires in 10 minutes.`;
      const sent = await sendRealSms(destination, message);
      return NextResponse.json({
        success: true,
        sentForReal: sent,
        preview: sent
          ? `We texted your code to ${destination} — it expires in 10 minutes.`
          : `Your verification code is ${code}. It expires in 10 minutes.`,
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
