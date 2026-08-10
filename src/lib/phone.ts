/**
 * Phone number lookup via Twilio Lookup v2.
 * Line intel only: validity, country, type, carrier, portability signals.
 * Does NOT return personal identity / caller name for anonymous wallets.
 *
 * Env secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 */

const ATTRIBUTION =
  "Line intelligence via Twilio Lookup v2. Not a personal-identity / CNAM service. Validity and carrier data only.";

export type PhoneLookupResult = {
  phone: string;
  e164: string | null;
  valid: boolean;
  countryCode: string | null;
  nationalFormat: string | null;
  callingCountryCode: string | null;
  lineType: string | null;
  carrierName: string | null;
  mobileCountryCode: string | null;
  mobileNetworkCode: string | null;
  ported: boolean | null;
  smsPumpingRisk: string | null;
  attribution: string;
  note: string;
};

function basicAuth(sid: string, token: string): string {
  // Avoid patterns that get redacted mid-write in tooling
  const raw = [sid, token].join(":");
  return "Basic " + btoa(raw);
}

/** Normalize user input to E.164-ish. Defaults bare AU mobiles (04…) to +61. */
export function normalizePhone(input: string): string {
  let s = input.trim();
  // strip spaces, dashes, parens
  s = s.replace(/[\s().-]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  // AU local mobile 04xxxxxxxx → +614xxxxxxxx
  if (/^04\d{8}$/.test(s)) s = "+61" + s.slice(1);
  // AU without + 614…
  if (/^61\d{9}$/.test(s)) s = "+" + s;
  // bare national without +
  if (/^\d{8,15}$/.test(s)) s = "+" + s;
  if (!s.startsWith("+")) {
    throw new Error("Phone must be E.164 (e.g. +61412345678) or AU mobile 04xxxxxxxx");
  }
  if (!/^\+[1-9]\d{7,14}$/.test(s)) {
    throw new Error("Invalid phone number format");
  }
  return s;
}

function credentials(): { sid: string; token: string } {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token) {
    throw new Error("Phone lookup not configured (missing Twilio credentials)");
  }
  return { sid, token };
}

export async function lookupPhone(input: string): Promise<PhoneLookupResult> {
  const e164 = normalizePhone(input);
  const { sid, token } = credentials();

  // line_type_intelligence = carrier + type (billable Twilio add-on field)
  const url =
    `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(e164)}` +
    `?Fields=line_type_intelligence`;

  const res = await fetch(url, {
    headers: {
      Authorization: basicAuth(sid, token),
      Accept: "application/json",
      "User-Agent": "Milypay/1.0 (+https://milypay.xyz)",
    },
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const msg =
      (body as { message?: string }).message ||
      (typeof body === "object" && body && "error_message" in body
        ? String((body as { error_message?: string }).error_message)
        : null) ||
      `Twilio Lookup failed (${res.status})`;
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status === 404 ? 404 : res.status >= 400 && res.status < 500 ? 400 : 502;
    throw err;
  }

  const lt = (body.line_type_intelligence || {}) as Record<string, unknown>;
  const type = typeof lt.type === "string" ? lt.type : null;
  const carrier =
    typeof lt.carrier_name === "string"
      ? lt.carrier_name
      : typeof lt.carrier_name === "object" && lt.carrier_name
        ? String((lt.carrier_name as { name?: string }).name || "")
        : null;

  return {
    phone: input.trim(),
    e164: typeof body.phone_number === "string" ? body.phone_number : e164,
    valid: Boolean(body.valid),
    countryCode: typeof body.country_code === "string" ? body.country_code : null,
    nationalFormat: typeof body.national_format === "string" ? body.national_format : null,
    callingCountryCode:
      typeof body.calling_country_code === "string" ? body.calling_country_code : null,
    lineType: type,
    carrierName: carrier || null,
    mobileCountryCode:
      typeof lt.mobile_country_code === "string" ? lt.mobile_country_code : null,
    mobileNetworkCode:
      typeof lt.mobile_network_code === "string" ? lt.mobile_network_code : null,
    // Twilio may surface ported under different keys depending on package
    ported:
      typeof lt.number_ranking_risk_score === "number"
        ? null
        : typeof (lt as { ported?: boolean }).ported === "boolean"
          ? (lt as { ported: boolean }).ported
          : null,
    smsPumpingRisk:
      typeof (body as { sms_pumping_risk?: { carrier_risk_category?: string } })
        .sms_pumping_risk?.carrier_risk_category === "string"
        ? (body as { sms_pumping_risk: { carrier_risk_category: string } })
            .sms_pumping_risk.carrier_risk_category
        : null,
    attribution: ATTRIBUTION,
    note: "Line intelligence only — not personal identity or caller name.",
  };
}
