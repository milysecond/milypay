import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOPIC_LABEL: Record<string, string> = {
  general: "General enquiry",
  provider: "List my API",
  stablecoin: "Stablecoin issuer",
};

function esc(s: string) {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string);
}

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot - bots fill hidden "company" field. Silently accept, don't send.
  if (body.company && body.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const org = (body.org || "").trim();
  const message = (body.message || "").trim();
  const topic = TOPIC_LABEL[body.topic] ? body.topic : "general";

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email delivery isn't configured yet. Please email hello@milypay.xyz." },
      { status: 503 },
    );
  }

  const to = process.env.CONTACT_TO || "gm@metasal.xyz";
  const from = process.env.CONTACT_FROM || "Milypay <onboarding@resend.dev>";
  const label = TOPIC_LABEL[topic];

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.6">
      <h2 style="margin:0 0 4px">New Milypay enquiry - ${esc(label)}</h2>
      <table style="border-collapse:collapse;margin-top:12px">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td>${esc(name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${esc(email)}</td></tr>
        ${org ? `<tr><td style="padding:4px 12px 4px 0;color:#666">Org</td><td>${esc(org)}</td></tr>` : ""}
        <tr><td style="padding:4px 12px 4px 0;color:#666">Topic</td><td>${esc(label)}</td></tr>
      </table>
      <p style="margin-top:16px;white-space:pre-wrap">${esc(message)}</p>
    </div>`;

  const resend = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Milypay · ${label} - ${name}`,
      html,
    }),
  });

  if (!resend.ok) {
    const detail = await resend.text().catch(() => "");
    console.error("Resend error", resend.status, detail);
    return NextResponse.json({ error: "Couldn't send right now. Please try again shortly." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
