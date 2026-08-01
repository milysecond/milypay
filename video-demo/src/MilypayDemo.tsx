import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BG = "#070A08";
const CARD = "#0C100D";
const GREEN = "#08D592";
const PURPLE = "#9C32DF";
const MUTED = "rgba(255,255,255,0.55)";
const FG = "#F7F8F7";
const BORDER = "rgba(255,255,255,0.1)";

const fade = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const fadeOut = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

function LabPanel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        padding: 28,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 18,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: MUTED,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function TitleCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14 } });
  const op = fade(frame, 0, 15) * fadeOut(frame, 70, 90);

  return (
    <AbsoluteFill
      style={{
        background: BG,
        opacity: op,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(8,213,146,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(8,213,146,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.5,
        }}
      />
      <div style={{ transform: `scale(${0.9 + scale * 0.1})`, textAlign: "center", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <Img src={staticFile("logo.png")} style={{ width: 72, height: 72 }} />
          <div
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 84,
              color: FG,
              letterSpacing: "-0.04em",
            }}
          >
            Mily<span style={{ color: GREEN }}>pay</span>
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 34,
            color: MUTED,
            maxWidth: 900,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.35,
          }}
        >
          Agent payments & Australian data on x402
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 18,
            color: GREEN,
            letterSpacing: "0.12em",
          }}
        >
          x402 · AUSTRALIA · AUDD
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ProblemCard() {
  const frame = useCurrentFrame();
  const op = fade(frame, 0, 12) * fadeOut(frame, 100, 120);
  const items = [
    "AI agents need Australian data",
    "No API keys. No signup.",
    "Pay per call. Settle in AUD.",
  ];

  return (
    <AbsoluteFill style={{ background: BG, opacity: op, justifyContent: "center", padding: 120 }}>
      <Eyebrow>The gap</Eyebrow>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 64,
          color: FG,
          letterSpacing: "-0.03em",
          maxWidth: 1100,
          lineHeight: 1.1,
          marginBottom: 48,
        }}
      >
        Keep agent spend <span style={{ color: GREEN }}>in AUD</span>
        <br />
        on every call.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {items.map((t, i) => {
          const itemOp = fade(frame, 20 + i * 12, 32 + i * 12);
          return (
            <div
              key={t}
              style={{
                opacity: itemOp,
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 32,
                color: FG,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  background: GREEN,
                  display: "inline-block",
                }}
              />
              {t}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function TerminalDemo() {
  const frame = useCurrentFrame();
  const op = fade(frame, 0, 12) * fadeOut(frame, 220, 240);
  const cmd = "npx milypay abn 51824753556";
  const typed = Math.floor(
    interpolate(frame, [20, 70], [0, cmd.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const showOut = frame > 85;
  const outLines = [
    '{',
    '  "abn": "51824753556",',
    '  "entityName": "AUSTRALIAN TAXATION OFFICE",',
    '  "abnStatus": "Active",',
    '  "entityType": "Commonwealth Government Entity",',
    '  "gstRegistered": true',
    '}',
  ];
  const linesVisible = Math.floor(
    interpolate(frame, [90, 160], [0, outLines.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <AbsoluteFill style={{ background: BG, opacity: op, justifyContent: "center", padding: 100 }}>
      <Eyebrow>CLI · live</Eyebrow>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 48,
          color: FG,
          marginBottom: 28,
          letterSpacing: "-0.03em",
        }}
      >
        One command. Real AU data.
      </div>
      <LabPanel style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          <span style={{ width: 12, height: 12, borderRadius: 99, background: BORDER }} />
          <span style={{ width: 12, height: 12, borderRadius: 99, background: BORDER }} />
          <span style={{ width: 12, height: 12, borderRadius: 99, background: GREEN }} />
          <span style={{ marginLeft: 12, color: MUTED, fontSize: 14, letterSpacing: "0.12em" }}>
            terminal
          </span>
        </div>
        <div style={{ fontSize: 28, color: FG, marginBottom: 20 }}>
          <span style={{ color: GREEN }}>$</span> {cmd.slice(0, typed)}
          <span style={{ opacity: frame % 30 < 15 ? 1 : 0, color: GREEN }}>▌</span>
        </div>
        {showOut && (
          <div style={{ fontSize: 22, lineHeight: 1.55, color: MUTED }}>
            {outLines.slice(0, linesVisible).map((l, i) => (
              <div key={i} style={{ color: l.includes("entityName") || l.includes("Active") ? GREEN : MUTED }}>
                {l}
              </div>
            ))}
          </div>
        )}
      </LabPanel>
      <div
        style={{
          marginTop: 22,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: MUTED,
          fontSize: 18,
        }}
      >
        free demo host · or <span style={{ color: GREEN }}>--api</span> with x402 wallet
      </div>
    </AbsoluteFill>
  );
}

function ServicesGrid() {
  const frame = useCurrentFrame();
  const op = fade(frame, 0, 12) * fadeOut(frame, 150, 170);
  const services = [
    { name: "ABN / business", price: "$0.002", path: "au-business" },
    { name: "ASIC company", price: "$0.002", path: "au-company" },
    { name: "Address / G-NAF", price: "$0.004", path: "au-address" },
    { name: "Super funds", price: "$0.002", path: "au-super" },
    { name: "Weather", price: "$0.001", path: "au-weather" },
    { name: "BSB lookup", price: "$0.002", path: "au-bsb" },
  ];

  return (
    <AbsoluteFill style={{ background: BG, opacity: op, padding: 100 }}>
      <Eyebrow>Services · per call · AUD</Eyebrow>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 48,
          color: FG,
          marginBottom: 36,
          letterSpacing: "-0.03em",
        }}
      >
        Australia, agent-ready.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
        }}
      >
        {services.map((s, i) => {
          const itemOp = fade(frame, 15 + i * 8, 28 + i * 8);
          return (
            <LabPanel
              key={s.path}
              style={{
                opacity: itemOp,
                minHeight: 140,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 14,
                  color: PURPLE,
                }}
              >
                milysec/{s.path}
              </div>
              <div
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 28,
                  color: FG,
                  fontWeight: 600,
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 18,
                  color: GREEN,
                }}
              >
                from {s.price} / call
              </div>
            </LabPanel>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function X402Flow() {
  const frame = useCurrentFrame();
  const op = fade(frame, 0, 12) * fadeOut(frame, 150, 170);
  const steps = [
    { t: "REQUEST", d: "GET /au-business/abn/…" },
    { t: "402", d: "0.002 AUDD · Solana" },
    { t: "SETTLE", d: "wallet approves · PayAI" },
    { t: "200 OK", d: "JSON data in same trip" },
  ];

  return (
    <AbsoluteFill style={{ background: BG, opacity: op, padding: 100, justifyContent: "center" }}>
      <Eyebrow>Protocol · x402</Eyebrow>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 48,
          color: FG,
          marginBottom: 48,
          letterSpacing: "-0.03em",
        }}
      >
        Payment is the auth.
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        {steps.map((s, i) => {
          const itemOp = fade(frame, 18 + i * 18, 32 + i * 18);
          const is402 = s.t === "402";
          const isOk = s.t === "200 OK";
          return (
            <React.Fragment key={s.t}>
              <LabPanel
                style={{
                  opacity: itemOp,
                  flex: 1,
                  borderColor: is402 ? PURPLE : isOk ? GREEN : BORDER,
                  background: isOk ? "rgba(8,213,146,0.08)" : CARD,
                }}
              >
                <div
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 22,
                    fontWeight: 700,
                    color: is402 ? PURPLE : isOk ? GREEN : FG,
                    marginBottom: 12,
                  }}
                >
                  {s.t}
                </div>
                <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 20, color: MUTED }}>
                  {s.d}
                </div>
              </LabPanel>
              {i < steps.length - 1 && (
                <div
                  style={{
                    opacity: itemOp,
                    alignSelf: "center",
                    color: GREEN,
                    fontSize: 28,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function CtaCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = fade(frame, 0, 15);
  const scale = spring({ frame, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: GREEN,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          transform: `scale(${0.92 + scale * 0.08})`,
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 800,
            fontSize: 64,
            color: "#04120c",
            letterSpacing: "-0.03em",
            maxWidth: 1100,
            lineHeight: 1.1,
          }}
        >
          What if your agent paid for Australia in AUD?
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 28,
            color: "#04120c",
            fontWeight: 600,
          }}
        >
          milypay.xyz
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 20,
            color: "rgba(4,18,12,0.7)",
          }}
        >
          npx milypay abn 51824753556
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 18,
            color: "rgba(4,18,12,0.65)",
          }}
        >
          A Milysec company
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const MilypayDemo: React.FC = () => {
  // Timeline @ 30fps
  // 0-90 title
  // 90-210 problem
  // 210-450 terminal
  // 450-630 services
  // 630-810 x402
  // 810-900 cta
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Sequence from={0} durationInFrames={90}>
        <TitleCard />
      </Sequence>
      <Sequence from={90} durationInFrames={120}>
        <ProblemCard />
      </Sequence>
      <Sequence from={210} durationInFrames={240}>
        <TerminalDemo />
      </Sequence>
      <Sequence from={450} durationInFrames={180}>
        <ServicesGrid />
      </Sequence>
      <Sequence from={630} durationInFrames={180}>
        <X402Flow />
      </Sequence>
      <Sequence from={810} durationInFrames={90}>
        <CtaCard />
      </Sequence>
    </AbsoluteFill>
  );
};
