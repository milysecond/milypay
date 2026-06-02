// Super Fund Lookup (SFL) client - ATO/ABR superannuation register.
// SOAP service at SflXmlSearch.asmx, GUID-authenticated (SFL_GUID env / Worker secret).
// Register for a free GUID at https://superfundlookup.gov.au/Documentation/WebServiceRegistration

import { XMLParser } from "fast-xml-parser";

const SFL_ENDPOINT = "https://superfundlookup.gov.au/xmlsearch/SflXmlSearch.asmx";
const NS = "http://superfundlookup.gov.au";

const parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true, parseTagValue: false });

function guid(): string {
  const g = process.env.SFL_GUID;
  if (!g) throw new Error("SFL_GUID is not configured");
  return g;
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

async function soap(operation: string, inner: string): Promise<Record<string, unknown>> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${operation} xmlns="${NS}">${inner}</${operation}>
  </soap:Body>
</soap:Envelope>`;
  const res = await fetch(SFL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `"${NS}/${operation}"`,
    },
    body,
  });
  if (!res.ok) throw new Error(`SFL upstream ${res.status}`);
  const xml = await res.text();
  const parsed = parser.parse(xml) as Record<string, unknown>;
  // Envelope > Body > <operation>Response > SuperFundPayload
  const env = parsed.Envelope as Record<string, unknown> | undefined;
  const soapBody = env?.Body as Record<string, unknown> | undefined;
  const resp = soapBody?.[`${operation}Response`] as Record<string, unknown> | undefined;
  const payload = resp?.SuperFundPayload as Record<string, unknown> | undefined;
  return (payload?.Response as Record<string, unknown>) || {};
}

export interface SuperFund {
  abn: string;
  abnStatus: string;
  fundName: string | null;
  fundType: string | null;
  fundTypeCode: string | null;
  complyingStatus: string | null;
  state: string | null;
  postcode: string | null;
  suburb: string | null;
  products: { usi: string; productName: string; contributionsRestricted: boolean }[];
}

interface RawFund {
  OrganisationName?: { Name?: string };
  Identifier?: { Value?: string; IdentifierStatus?: { Description?: string } };
  FundType?: { Code?: string; Description?: string };
  ComplyingStatus?: { Description?: string };
  Address?: { SuburbLocalityName?: string; StateTerritoryCode?: string; Postcode?: string };
  FundProduct?: unknown;
}

function normalise(fund: RawFund): SuperFund {
  return {
    abn: fund.Identifier?.Value ?? "",
    abnStatus: fund.Identifier?.IdentifierStatus?.Description ?? "Unknown",
    fundName: fund.OrganisationName?.Name ?? null,
    fundType: fund.FundType?.Description ?? null,
    fundTypeCode: fund.FundType?.Code ?? null,
    complyingStatus: fund.ComplyingStatus?.Description ?? null,
    suburb: fund.Address?.SuburbLocalityName ?? null,
    state: fund.Address?.StateTerritoryCode ?? null,
    postcode: fund.Address?.Postcode ?? null,
    products: asArray(fund.FundProduct as { Usi?: string; ProductName?: string; ContributionRestrictions?: string }[] | undefined).map((p) => ({
      usi: p.Usi ?? "",
      productName: p.ProductName ?? "",
      contributionsRestricted: p.ContributionRestrictions === "Y",
    })),
  };
}

export async function lookupSuperByAbn(abn: string): Promise<SuperFund | { error: string }> {
  const clean = abn.replace(/\s+/g, "");
  if (!/^\d{11}$/.test(clean)) return { error: "ABN must be 11 digits" };
  const response = await soap("SearchByABN2015", `<abn>${clean}</abn><guid>${guid()}</guid>`);
  const exception = response.SuperFundExceptionList as Record<string, unknown> | undefined;
  const fund = response.SuperannuationFund2015 as RawFund | undefined;
  if (!fund) {
    const msg = exception ? "ABN is not a registered superannuation fund" : "Super fund not found";
    return { error: msg };
  }
  return normalise(fund);
}
