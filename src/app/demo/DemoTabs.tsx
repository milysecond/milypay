"use client";

import { useState } from "react";
import DemoClient from "./DemoClient";
import CompanyDemo from "./CompanyDemo";
import AddressDemo from "./AddressDemo";
import SuperDemo from "./SuperDemo";
import WeatherDemo from "./WeatherDemo";
import PostageDemo from "./PostageDemo";
import BsbDemo from "./BsbDemo";

type Service = "business" | "company" | "address" | "super" | "weather" | "postage" | "bsb";

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
          {tab("company", "Company (ASIC)")}
          {tab("address", "Address (G-NAF)")}
          {tab("super", "Super Fund")}
          {tab("weather", "Weather")}
          {tab("postage", "Postage")}
          {tab("bsb", "BSB")}
        </div>
        <p className="mt-3 text-sm text-muted">
          {service === "business" && "Live milysec/au-business - real ATO data."}
          {service === "company" && "Live milysec/au-company - ASIC company register (3.9M companies)."}
          {service === "address" && "Live milysec/au-address - 16.9M addresses from G-NAF."}
          {service === "super" && "Live milysec/au-super - ATO Super Fund Lookup register."}
          {service === "weather" && "Live milysec/au-weather - forecast for any Australian address."}
          {service === "postage" && "Live milysec/au-postage - Australia Post parcel rates between postcodes."}
          {service === "bsb" && "Live milysec/au-bsb - 17,000+ BSBs from the AusPayNet directory."}
        </p>
      </div>
      <div className="mt-6">
        {service === "business" && <DemoClient />}
        {service === "company" && <CompanyDemo />}
        {service === "address" && <AddressDemo />}
        {service === "super" && <SuperDemo />}
        {service === "weather" && <WeatherDemo />}
        {service === "postage" && <PostageDemo />}
        {service === "bsb" && <BsbDemo />}
      </div>
    </div>
  );
}
