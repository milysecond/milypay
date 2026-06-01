"use client";

import { useState } from "react";
import DemoClient from "./DemoClient";
import AddressDemo from "./AddressDemo";

type Service = "business" | "address" | "super";

export default function DemoTabs() {
  const [service, setService] = useState<Service>("business");

  const tab = (key: Service, label: string, soon = false) => (
    <button
      type="button"
      onClick={() => setService(key)}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
        service === key ? "bg-brand-green text-bg" : "text-muted hover:text-fg"
      }`}
    >
      {label}
      {soon && (
        <span className="ml-2 rounded-full border border-border-brand px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          soon
        </span>
      )}
    </button>
  );

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6">
        <div className="inline-flex flex-wrap rounded-full border border-border-brand bg-card p-1">
          {tab("business", "Business (ABN)")}
          {tab("address", "Address (G-NAF)")}
          {tab("super", "Super Fund", true)}
        </div>
        <p className="mt-3 text-sm text-muted">
          {service === "business" && "Live milysec/au-business - real ATO data."}
          {service === "address" && "Live milysec/au-address - 16.9M addresses from G-NAF."}
          {service === "super" && "milysec/au-super - Super Fund Lookup, coming soon."}
        </p>
      </div>
      <div className="mt-6">
        {service === "business" && <DemoClient />}
        {service === "address" && <AddressDemo />}
        {service === "super" && (
          <div className="mx-auto max-w-3xl px-6 pb-24">
            <div className="card p-8 text-center md:p-12">
              <span className="inline-flex items-center rounded-full border border-border-brand px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-green">
                Coming soon
              </span>
              <h3 className="font-display mt-5 text-2xl tracking-tight md:text-3xl">
                Super Fund Lookup
              </h3>
              <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted">
                Verify any Australian superannuation fund by ABN or USI - fund name, status,
                type, and electronic-rollover details - straight from the ATO&rsquo;s Super
                Fund Lookup register, priced per call in AUDD over x402.
              </p>
              <code className="mt-5 inline-block text-xs text-brand-purple">milysec/au-super</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
