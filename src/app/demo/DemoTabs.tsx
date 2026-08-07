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
import AbsDemo from "./AbsDemo";
import EnergyDemo from "./EnergyDemo";
import TransitDemo from "./TransitDemo";

type Service =
  | "business"
  | "company"
  | "address"
  | "super"
  | "weather"
  | "postage"
  | "bsb"
  | "abs"
  | "energy"
  | "transit";

const SERVICES: Service[] = [
  "business",
  "company",
  "address",
  "super",
  "weather",
  "postage",
  "bsb",
  "abs",
  "energy",
  "transit",
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

  useEffect(() => {
    setService(parseService(tabParam));
  }, [tabParam]);

  const selectService = useCallback(
    (key: Service) => {
      setService(key);
      const params = new URLSearchParams(searchParams.toString());
      if (key === "business") params.delete("tab");
      else params.set("tab", key);
      if (key !== "company") params.delete("acn");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const tab = (key: Service, label: string) => (
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
    </button>
  );

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6">
        <div className="inline-flex flex-wrap gap-1 border border-border-brand bg-card p-1">
          {tab("business", "Business")}
          {tab("company", "Company")}
          {tab("address", "Address")}
          {tab("super", "Super")}
          {tab("weather", "Weather")}
          {tab("postage", "Postage")}
          {tab("bsb", "BSB")}
          {tab("abs", "ABS")}
          {tab("energy", "Energy")}
          {tab("transit", "Transit")}
        </div>
        <p className="mt-3 text-sm text-muted">
          {service === "business" && "Live milysec/au-business — real ATO data."}
          {service === "company" && (
            <>
              Live milysec/au-company open data, plus sandbox ASIC extract.{" "}
              <a
                href="https://connectonline.asic.gov.au/RegistrySearch/faces/landing/SearchRegisters.jspx"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-green hover:underline"
              >
                Official ASIC search
              </a>
              .
            </>
          )}
          {service === "address" && "Live milysec/au-address — 16.9M G-NAF addresses."}
          {service === "super" && "Live milysec/au-super — ATO Super Fund Lookup."}
          {service === "weather" && "Live milysec/au-weather — Australian forecast."}
          {service === "postage" && "Live milysec/au-postage — Australia Post rates."}
          {service === "bsb" && "Live milysec/au-bsb — AusPayNet BSB directory."}
          {service === "abs" && "Live milysec/au-abs — ABS SDMX statistics."}
          {service === "energy" && "Live milysec/au-energy — AEMO NEM wholesale $/MWh."}
          {service === "transit" &&
            "Live milysec/au-transit — GTFS-RT vehicles/trips/alerts (QLD/SA/VIC/NSW)."}
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
        {service === "abs" && <AbsDemo />}
        {service === "energy" && <EnergyDemo />}
        {service === "transit" && <TransitDemo />}
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
