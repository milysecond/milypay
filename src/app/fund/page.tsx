"use client";

import { useCallback, useEffect, useState } from "react";

type Session = {
  ok?: boolean;
  sessionId?: string;
  sessionToken?: string;
  widgetUrl?: string;
  sdkUrl?: string;
  env?: string;
  mode?: string;
  source?: string;
  demo?: boolean;
  error?: string;
  next?: string[];
};

type ChallengeSample = {
  code?: string;
  price?: string;
  funding?: {
    moneygram?: {
      session?: string;
      demoUi?: string;
      note?: string;
    };
  };
  howToPay?: Record<string, string>;
};

export default function FundPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sample402, setSample402] = useState<ChallengeSample | null>(null);
  const [mode, setMode] = useState<"on-ramp" | "off-ramp">("on-ramp");

  const load402 = useCallback(async () => {
    try {
      const res = await fetch("https://api.milypay.xyz/au-energy/nem", {
        cache: "no-store",
      });
      const data = (await res.json()) as ChallengeSample;
      setSample402(data);
    } catch (e) {
      setSample402({
        code: "payment_required",
        price: "(sample unavailable)",
      });
    }
  }, []);

  useEffect(() => {
    void load402();
  }, [load402]);

  async function startSession() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/ramp/moneygram/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = (await res.json()) as Session;
      if (!res.ok || !data.widgetUrl) {
        throw new Error(data.error || `Session failed (${res.status})`);
      }
      setSession(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "2.5rem 1.25rem 4rem",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        color: "#0f172a",
        lineHeight: 1.55,
      }}
    >
      <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, color: "#64748b" }}>
        Milypay demo · sandbox
      </p>
      <h1 style={{ fontSize: "1.75rem", margin: "0.35rem 0 0.75rem" }}>
        Fund wallet → pay x402
      </h1>
      <p style={{ color: "#334155", marginTop: 0 }}>
        MoneyGram does <strong>not</strong> settle the API call. It tops up USDC so you can answer{" "}
        <code>PAYMENT-REQUIRED</code> and retry with <code>PAYMENT-SIGNATURE</code>.
      </p>

      <ol style={{ paddingLeft: "1.2rem", color: "#334155" }}>
        <li>Call a paid endpoint → HTTP 402</li>
        <li>If underfunded, start a MoneyGram sandbox session below</li>
        <li>Complete the widget → USDC lands in your Solana wallet</li>
        <li>Sign x402 and retry the original request</li>
      </ol>

      <section
        style={{
          marginTop: "1.5rem",
          padding: "1rem 1.1rem",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          background: "#f8fafc",
        }}
      >
        <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>1) Sample 402 (live)</h2>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 0 }}>
          <code>GET https://api.milypay.xyz/au-energy/nem</code>
        </p>
        <pre
          style={{
            overflow: "auto",
            background: "#0f172a",
            color: "#e2e8f0",
            padding: "0.85rem 1rem",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          {JSON.stringify(
            sample402
              ? {
                  code: sample402.code,
                  price: sample402.price,
                  funding: sample402.funding,
                  howToPay: sample402.howToPay,
                }
              : { loading: true },
            null,
            2,
          )}
        </pre>
      </section>

      <section
        style={{
          marginTop: "1.25rem",
          padding: "1rem 1.1rem",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>2) MoneyGram session</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 14 }}>
            Mode{" "}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "on-ramp" | "off-ramp")}
              style={{ marginLeft: 6, padding: "0.35rem 0.5rem" }}
            >
              <option value="on-ramp">on-ramp (fund)</option>
              <option value="off-ramp">off-ramp (cash out)</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void startSession()}
            disabled={busy}
            style={{
              background: "#0f766e",
              color: "white",
              border: 0,
              borderRadius: 8,
              padding: "0.55rem 1rem",
              fontWeight: 600,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? "Creating…" : "Create sandbox session"}
          </button>
        </div>
        {err && (
          <p style={{ color: "#b91c1c", fontSize: 14 }} role="alert">
            {err}
          </p>
        )}
        {session?.widgetUrl && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>
              env: <code>{session.env}</code> · source: <code>{session.source}</code> · mode:{" "}
              <code>{session.mode}</code>
              {session.demo ? " · demo" : ""}
            </p>
            <a
              href={session.widgetUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                background: "#115e59",
                color: "white",
                textDecoration: "none",
                padding: "0.6rem 1rem",
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              Open MoneyGram widget →
            </a>
            <pre
              style={{
                marginTop: "0.85rem",
                overflow: "auto",
                background: "#f1f5f9",
                padding: "0.75rem",
                borderRadius: 8,
                fontSize: 11,
              }}
            >
              {JSON.stringify(
                {
                  sessionId: session.sessionId,
                  widgetUrl: session.widgetUrl,
                  sdkUrl: session.sdkUrl,
                  // token intentionally truncated in UI paste safety
                  sessionToken: session.sessionToken
                    ? `${session.sessionToken.slice(0, 24)}…`
                    : undefined,
                },
                null,
                2,
              )}
            </pre>
            <iframe
              title="MoneyGram Ramps"
              src={session.widgetUrl}
              style={{
                width: "100%",
                minHeight: 520,
                border: "1px solid #cbd5e1",
                borderRadius: 12,
                marginTop: 12,
                background: "white",
              }}
              allow="camera; microphone; payment"
            />
          </div>
        )}
      </section>

      <section style={{ marginTop: "1.5rem", fontSize: 14, color: "#475569" }}>
        <h2 style={{ fontSize: "1.05rem", color: "#0f172a" }}>3) Agent API</h2>
        <pre style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: 8, overflow: "auto" }}>
{`# status
curl https://api.milypay.xyz/ramp/moneygram

# session
curl -X POST https://api.milypay.xyz/ramp/moneygram/session \\
  -H 'content-type: application/json' \\
  -d '{"mode":"on-ramp"}'

# then pay x402 as usual on any paid route`}
        </pre>
        <p>
          Docs: <a href="/agents.md">agents.md</a> · Prod keys later — this page is sandbox/demo.
        </p>
      </section>
    </main>
  );
}
