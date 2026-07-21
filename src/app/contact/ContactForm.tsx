"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Topic = "general" | "provider" | "stablecoin";

const TOPICS: Record<Topic, { label: string; prompt: string; placeholder: string }> = {
  general: {
    label: "General enquiry",
    prompt: "What can we help you with?",
    placeholder: "Tell us what you're building or what you need…",
  },
  provider: {
    label: "List my API",
    prompt: "Tell us about your API.",
    placeholder: "What does your API do, and what would you price in AUD?",
  },
  stablecoin: {
    label: "Stablecoin issuer",
    prompt: "Tell us about your AUD stablecoin.",
    placeholder: "Which chains, what licence, and where you'd like agent distribution…",
  },
};

type Field = "name" | "email" | "org" | "message";

export default function ContactForm() {
  const params = useSearchParams();
  const topic: Topic = useMemo(() => {
    const t = params.get("topic");
    return t === "provider" || t === "stablecoin" ? t : "general";
  }, [params]);

  const steps = useMemo(
    () => [
      { field: "name" as Field, q: "First - what's your name?", type: "text", required: true, placeholder: "Jane Smith" },
      { field: "email" as Field, q: "Where can we reach you?", type: "email", required: true, placeholder: "jane@company.com.au" },
      { field: "org" as Field, q: "Company or project?", type: "text", required: false, placeholder: "Optional" },
      { field: "message" as Field, q: TOPICS[topic].prompt, type: "textarea", required: true, placeholder: TOPICS[topic].placeholder },
    ],
    [topic],
  );

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", org: "", message: "" });
  const [hp, setHp] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const value = values[current.field];
  const valid =
    !current.required ||
    (current.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) : value.trim().length > 0);

  function next() {
    if (!valid) return;
    if (isLast) void submit();
    else setStep((s) => s + 1);
  }

  async function submit() {
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, topic, company: hp }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand-green/40 text-brand-green">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display mt-6 text-3xl tracking-tight md:text-4xl">Got it - thanks.</h1>
        <p className="mt-4 leading-relaxed text-muted">
          Your message is on its way to the Milypay team. We&rsquo;ll get back to you at{" "}
          <span className="text-fg">{values.email}</span>.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-border-brand bg-card px-6 py-3 text-sm font-semibold text-fg transition hover:border-brand-green/40"
        >
          ← Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-16">
      {/* progress */}
      <div className="mb-10 flex items-center gap-2">
        {steps.map((s, i) => (
          <span
            key={s.field}
            className={`h-1 flex-1 rounded-full transition ${i <= step ? "brand-gradient-bg" : "bg-card"}`}
          />
        ))}
      </div>

      <div className="text-xs font-semibold uppercase tracking-widest text-brand-green">
        {TOPICS[topic].label} · {step + 1} of {steps.length}
      </div>

      <label htmlFor={current.field} className="font-display mt-3 text-2xl tracking-tight md:text-4xl">
        {current.q}
        {!current.required && <span className="ml-2 text-base text-muted">(optional)</span>}
      </label>

      {/* honeypot - hidden from humans */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="absolute left-[-9999px]"
        aria-hidden="true"
      />

      {current.type === "textarea" ? (
        <textarea
          id={current.field}
          autoFocus
          rows={4}
          value={value}
          placeholder={current.placeholder}
          onChange={(e) => setValues((v) => ({ ...v, [current.field]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) next();
          }}
          className="mt-8 w-full resize-none border-b border-border-brand bg-transparent pb-3 text-lg text-fg outline-none placeholder:text-muted/50 focus:border-brand-green"
        />
      ) : (
        <input
          id={current.field}
          autoFocus
          type={current.type}
          value={value}
          placeholder={current.placeholder}
          onChange={(e) => setValues((v) => ({ ...v, [current.field]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") next();
          }}
          className="mt-8 w-full border-b border-border-brand bg-transparent pb-3 text-xl text-fg outline-none placeholder:text-muted/50 focus:border-brand-green"
        />
      )}

      {error && <p className="mt-4 text-sm text-brand-purple">{error}</p>}

      <div className="mt-10 flex items-center gap-4">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="text-sm text-muted transition hover:text-fg"
          >
            ← Back
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={!valid || status === "submitting"}
          className="rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "submitting" ? "Sending…" : isLast ? "Send message" : "OK"}
        </button>
        <span className="hidden text-xs text-muted sm:inline">
          press <kbd className="rounded border border-border-brand px-1.5 py-0.5">Enter ↵</kbd>
          {current.type === "textarea" && " with ⌘"}
        </span>
      </div>
    </div>
  );
}
