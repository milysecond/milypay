"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DemoClient from "./DemoClient";
import CompanyDemo from "./CompanyDemo";
import AddressDemo from "./AddressDemo";
import SuperDemo from "./SuperDemo";
import WeatherDemo from "./WeatherDemo";
import PostageDemo from "./PostageDemo";
import BsbDemo from "./BsbDemo";

type Service = "business" | "company" | "address" | "super" | "weather" | "postage" | "bsb";

const SERVICES: Service[] = [
  "business",
  "company",
  "address",
  "super",
  "weather",
  "postage",
  "bsb",
];

function parseService(raw: string | null): Service {
  if (raw && (SERVICES as string[]).includes(raw)) return raw as Service;
  return "business";
}

function DemoTabsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const acnParam = searchParams.get("acn");
  const [service, setService] = useState<Service>(() => parseService(tabParam));

  // Keep local tab in sync when the URL changes (deeplink / back-forward).
  useEffect(() => {
    setService(parseService(tabParam));
  }, [tabParam]);

  const selectService = useCallback(
    (key: Service) => {
      setService(key);
      const params = new URLSearchParams(searchParams.toString());
      if (key === "business") params.delete("tab");
      else params.set("tab", key);
      // Drop ACN when leaving the company tab so the URL stays honest.
      if (key !== "company") params.delete("acn");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const tab = (key: Service, label: string, soon = false) => (
    <button
      type="button"
      onClick={() => selectService(key)}
      className={`rounded-md px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ${
        service === key
          ? "bg-brand-green text-cta-fg"
          : "text-muted hover:bg-secondary hover:text-fg"
      }`}
    >
      {label}
      {soon && (
        <span className="ml-2 border border-border-brand px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted">
          soon
        </span>
      )}
    </button>
  );

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6">
        <div className="inline-flex flex-wrap gap-1 border border-border-brand bg-card p-1">
          {tab("business", "Business (ABN)")}
          {tab("company", "Company (ASIC)")}
          {tab("address", "Address (G-NAF)")}
          {tab("super", "Super Fund")}
          {tab("weather", "Weather")}
          {tab("postage", "Postage")}
          {tab("bsb", "BSB")}
        </div>
        <p className="mt-3 text-sm text-muted">
          {service === "business" && "Live milysec/au-business - real ATO data."}
          {service === "company" && (
            <>
              Live milysec/au-company open data (3.9M companies), plus sandbox company extract demo via Business API test keys.{" "}
              <a
                href="https://connectonline.asic.gov.au/RegistrySearch/faces/landing/SearchRegisters.jspx"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-green hover:underline"
              >
                Official ASIC company search
              </a>
              .
            </>
          )}
          {service === "address" && "Live milysec/au-address - 16.9M addresses from G-NAF."}
          {service === "super" && "Live milysec/au-super - ATO Super Fund Lookup register."}
          {service === "weather" && "Live milysec/au-weather - forecast for any Australian address."}
          {service === "postage" && "Live milysec/au-postage - Australia Post parcel rates between postcodes."}
          {service === "bsb" && "Live milysec/au-bsb - 17,000+ BSBs from the AusPayNet directory."}
        </p>
      </div>
      <div className="mt-6">
        {service === "business" && <DemoClient />}
        {service === "company" && <CompanyDemo initialAcn={acnParam} />}
        {service === "address" && <AddressDemo />}
        {service === "super" && <SuperDemo />}
        {service === "weather" && <WeatherDemo />}
        {service === "postage" && <PostageDemo />}
        {service === "bsb" && <BsbDemo />}
      </div>
    </div>
  );
}

export default function DemoTabs() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-6 pb-24 text-sm text-muted">Loading demos...</div>
      }
    >
      <DemoTabsInner />
    </Suspense>
  );
}
