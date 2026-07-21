"use client";

import { useState, type ReactNode } from "react";

const KEYWORDS_AND_STRINGS =
  /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(npx|curl|import|from|const|let|await|new|return|export)\b/g;

function renderLine(line: string, key: number): ReactNode {
  const trimmed = line.trimStart();
  if (trimmed.startsWith("//") || trimmed.startsWith("#")) {
    return (
      <div key={key} className="text-muted">
        {line || " "}
      </div>
    );
  }
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  KEYWORDS_AND_STRINGS.lastIndex = 0;
  while ((m = KEYWORDS_AND_STRINGS.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    if (m[1]) out.push(<span key={i++} className="text-brand-green">{m[1]}</span>);
    else if (m[2]) out.push(<span key={i++} className="text-brand-purple">{m[2]}</span>);
    last = KEYWORDS_AND_STRINGS.lastIndex;
  }
  if (last < line.length) out.push(line.slice(last));
  return (
    <div key={key}>{out.length ? out : " "}</div>
  );
}

export default function CodeBlock({ code, plain = false }: { code: string; plain?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="group/code relative">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="absolute right-2 top-2 z-10 flex min-h-8 min-w-8 items-center gap-1 rounded-md border border-border-brand bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted opacity-0 transition hover:text-fg group-hover/code:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30"
      >
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-brand-green" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            Copy
          </>
        )}
      </button>
      <pre
        className={`rounded-lg border border-border-brand bg-bg p-3 pr-14 text-[11px] leading-relaxed ${
          plain ? "whitespace-pre-wrap break-words" : "overflow-x-auto"
        }`}
      >
        <code>
          {plain
            ? code
            : code.split("\n").map((line, idx) => renderLine(line, idx))}
        </code>
      </pre>
    </div>
  );
}
