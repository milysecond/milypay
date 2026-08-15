/**
 * Doma Protocol partner integration — tokenized DNS registration.
 * Docs: https://docs.doma.xyz/api-reference/domain-registration
 *
 * Off-chain: GraphQL (Api-Key). On-chain: Marketplace.pay(voucher, signature).
 *
 * Env:
 *   DOMA_API_KEY
 *   DOMA_PRIVATE_KEY          0x… wallet that pays Marketplace + gas (receives nothing if buyer set)
 *   DOMA_NETWORK              testnet | mainnet (default testnet)
 *   DOMA_VERIFIED_UPLOAD      true if key has VERIFIED_CONTACTS_UPLOAD
 *   DOMA_REGISTRANT_*         WHOIS defaults for verified upload
 *   DOMA_MARKUP_USD           markup on USD list price (default 3)
 *   DOMA_BUYER                optional default CAIP-10 / 0x buyer for name token
 */

import {
  createPublicClient,
  createWalletClient,
  defineChain,
  erc20Abi,
  getAddress,
  http,
  parseAbi,
  zeroAddress,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export type DomaNetwork = "testnet" | "mainnet";

const NETWORKS = {
  testnet: {
    apiUrl: "https://api-testnet.doma.xyz/graphql",
    rpcUrl: "https://rpc-testnet.doma.xyz",
    chainId: 97476,
    explorer: "https://explorer-testnet.doma.xyz",
    // mock USDC on Doma testnet (from official register example)
    usdc: "0x8725f6FDF6E240C303B4e7A60AD13267Fa04d55C" as Address,
    registrarIanaId: 3784,
  },
  mainnet: {
    apiUrl: "https://api.doma.xyz/graphql",
    rpcUrl: "https://rpc.doma.xyz",
    chainId: 97477,
    explorer: "https://explorer.doma.xyz",
    // override via DOMA_USDC_ADDRESS when known
    usdc: (process.env.DOMA_USDC_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as Address,
    registrarIanaId: Number(process.env.DOMA_REGISTRAR_IANA_ID || 3784),
  },
} as const;

const MARKETPLACE_ABI = parseAbi([
  "function pay((address buyer, address token, uint256 amount, uint256 voucherExpiration, string paymentId, string orderId) voucher, bytes signature) payable",
]);

function networkName(): DomaNetwork {
  const n = (process.env.DOMA_NETWORK || "testnet").toLowerCase();
  return n === "mainnet" ? "mainnet" : "testnet";
}

function cfg() {
  return NETWORKS[networkName()];
}

export function domaConfigured(): boolean {
  return Boolean(process.env.DOMA_API_KEY?.trim());
}

export function domaPayerConfigured(): boolean {
  const pk = process.env.DOMA_PRIVATE_KEY?.trim();
  return Boolean(pk && /^0x[0-9a-fA-F]{64}$/.test(pk));
}

function markupUsd(): number {
  const n = Number(process.env.DOMA_MARKUP_USD || "3");
  return Number.isFinite(n) && n >= 0 ? n : 3;
}

function agentPrice(listUsd: number | null): number | null {
  if (listUsd == null || !Number.isFinite(listUsd)) return null;
  return Math.round((listUsd + markupUsd()) * 100) / 100;
}

export function listDomaProducts() {
  const c = cfg();
  return {
    brand: "Milypay",
    service: "domains/doma",
    provider: "doma",
    mode: "tokenized_register",
    docs: "https://docs.doma.xyz/api-reference/domain-registration",
    configured: domaConfigured(),
    payerConfigured: domaPayerConfigured(),
    network: networkName(),
    caip2: `eip155:${c.chainId}`,
    explorer: c.explorer,
    verifiedContactsUpload: process.env.DOMA_VERIFIED_UPLOAD === "true",
    markupUsd: markupUsd(),
    endpoints: [
      { path: "/domains/doma", method: "GET", price: "0.001", description: "Doma catalogue" },
      { path: "/domains/doma/check?name=", method: "GET", price: "0.01", description: "Availability" },
      { path: "/domains/doma/quote?name=&years=", method: "GET", price: "0.01", description: "Agent price" },
      {
        path: "/domains/doma/contacts/init-email",
        method: "POST",
        price: "0.01",
        description: "Start WHOIS email verification",
      },
      {
        path: "/domains/doma/contacts/complete-email",
        method: "POST",
        price: "0.01",
        description: "Complete email verification → proof",
      },
      {
        path: "/domains/doma/register",
        method: "POST",
        price: "variable",
        description: "x402 then Doma order+on-chain pay+poll",
      },
      { path: "/domains/doma/order?id=", method: "GET", price: "0.005", description: "Poll order status" },
    ],
    note: "Tokenized ICANN DNS via Doma. Agent pays Milypay x402; Milypay settles Doma Marketplace. Name token mint to buyer wallet.",
  };
}

async function gql<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const key = process.env.DOMA_API_KEY?.trim();
  if (!key) {
    throw Object.assign(new Error("Doma API not configured"), {
      code: "not_configured",
      status: 503,
    });
  }
  const c = cfg();
  const res = await fetch(c.apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Api-Key": key,
      "api-key": key,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };
  if (!res.ok || json.errors?.length) {
    const msg = json.errors?.map((e) => e.message).filter(Boolean).join("; ") || `Doma HTTP ${res.status}`;
    throw Object.assign(new Error(msg), {
      code: "doma_error",
      status: res.status >= 500 ? 502 : 400,
      upstream: json.errors,
    });
  }
  return json.data as T;
}

function normalizeName(input: string): string {
  let d = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  d = d.replace(/^www\./, "");
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i.test(d)) {
    throw Object.assign(new Error("Invalid domain name"), { code: "bad_request", status: 400 });
  }
  return d;
}

export type DomaCheck = {
  brand: "Milypay";
  provider: "doma";
  name: string;
  status: string;
  listPriceUsd: number | null;
  available: boolean;
  registrars: Array<{
    registrarIanaId: number;
    registrarName?: string;
    available: boolean;
    minYears: number;
    maxYears: number;
    registerPrice?: number;
    renewalPrice?: number;
  }>;
  agentPriceUsd: number | null;
  network: string;
  fetchedAt: string;
};

export async function domaCheck(nameInput: string): Promise<DomaCheck> {
  const name = normalizeName(nameInput);
  const sld = name.split(".")[0]!;

  const avail = await gql<{
    availableDomains: {
      items: Array<{ fullName: string; status: string; price?: number | string; tld?: string }>;
    };
  }>(
    `query AvailableDomains($name: String!) {
      availableDomains(name: $name, take: 20) {
        items { fullName status price tld }
      }
    }`,
    { name: sld },
  );

  const match =
    avail.availableDomains.items.find((d) => d.fullName.toLowerCase() === name) ||
    avail.availableDomains.items.find((d) => d.fullName.toLowerCase().startsWith(sld + "."));

  const pricing = await gql<{
    domainPricing: Array<{
      fullName?: string;
      status?: string;
      registrars: Array<{
        registrarIanaId: number;
        registrarName?: string;
        available: boolean;
        minYears: number;
        maxYears: number;
        registerPrice?: number | string;
        renewalPrice?: number | string;
      }>;
    }>;
  }>(
    `query DomainPricing($domains: [String!]!, $operation: QuoteOperation) {
      domainPricing(domains: $domains, operation: $operation) {
        fullName status
        registrars {
          registrarIanaId registrarName available minYears maxYears registerPrice renewalPrice
        }
      }
    }`,
    { domains: [name], operation: "REGISTRATION" },
  );

  const row = pricing.domainPricing?.[0];
  const registrars = (row?.registrars || []).map((r) => ({
    registrarIanaId: r.registrarIanaId,
    registrarName: r.registrarName,
    available: Boolean(r.available),
    minYears: Number(r.minYears || 1),
    maxYears: Number(r.maxYears || 10),
    registerPrice: r.registerPrice != null ? Number(r.registerPrice) : undefined,
    renewalPrice: r.renewalPrice != null ? Number(r.renewalPrice) : undefined,
  }));

  const best = registrars.find((r) => r.available && r.registerPrice != null) || registrars[0];
  const list =
    best?.registerPrice ??
    (match?.price != null ? Number(match.price) : null);
  const status = match?.status || row?.status || "UNKNOWN";
  const available = status === "AVAILABLE" && Boolean(best?.available);

  return {
    brand: "Milypay",
    provider: "doma",
    name,
    status,
    listPriceUsd: list,
    available,
    registrars,
    agentPriceUsd: agentPrice(list),
    network: networkName(),
    fetchedAt: new Date().toISOString(),
  };
}

export type DomaQuote = DomaCheck & {
  years: number;
  chargeUsd: string;
  markupUsd: number;
  registrarIanaId: number | null;
  canRegister: boolean;
  reason?: string;
};

export async function domaQuote(nameInput: string, years = 1): Promise<DomaQuote> {
  const check = await domaCheck(nameInput);
  const y = Math.min(10, Math.max(1, Math.floor(years || 1)));
  const best =
    check.registrars.find((r) => r.available && r.registerPrice != null) || check.registrars[0];
  const listPerYear = best?.registerPrice ?? check.listPriceUsd;
  const listTotal = listPerYear != null ? listPerYear * y : null;
  const charge = agentPrice(listTotal);
  const can =
    check.available &&
    charge != null &&
    best != null &&
    y >= (best.minYears || 1) &&
    y <= (best.maxYears || 10);

  return {
    ...check,
    years: y,
    chargeUsd: charge != null ? charge.toFixed(2) : "0",
    markupUsd: markupUsd(),
    registrarIanaId: best?.registrarIanaId ?? null,
    canRegister: can,
    reason: can
      ? undefined
      : !check.available
        ? "unavailable"
        : charge == null
          ? "price_unavailable"
          : "cannot_register",
  };
}

export async function initEmailVerification(email: string): Promise<{ ok: boolean }> {
  await gql(
    `mutation InitEmail($email: String!) {
      initiateEmailVerification(email: $email)
    }`,
    { email },
  );
  return { ok: true };
}

export async function completeEmailVerification(
  email: string,
  code: string,
): Promise<{ proof: string }> {
  const data = await gql<{ completeEmailVerification: string }>(
    `mutation CompleteEmail($email: String!, $code: String!) {
      completeEmailVerification(email: $email, code: $code)
    }`,
    { email, code },
  );
  return { proof: data.completeEmailVerification };
}

export type RegistrantContact = {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
};

function defaultContact(overrides?: Partial<RegistrantContact>): RegistrantContact {
  return {
    name: process.env.DOMA_REGISTRANT_NAME || "Milypay Agent Registration",
    email: process.env.DOMA_REGISTRANT_EMAIL || overrides?.email || "",
    phone: process.env.DOMA_REGISTRANT_PHONE || "+61.400000000",
    street: process.env.DOMA_REGISTRANT_STREET || "1 Collins Street",
    city: process.env.DOMA_REGISTRANT_CITY || "Melbourne",
    state: process.env.DOMA_REGISTRANT_STATE || "VIC",
    postalCode: process.env.DOMA_REGISTRANT_POSTAL || "3000",
    countryCode: process.env.DOMA_REGISTRANT_COUNTRY || "AU",
    ...overrides,
  };
}

export async function uploadContacts(opts: {
  contact: RegistrantContact;
  registrarIanaId: number;
  emailVerificationProof?: string;
}): Promise<{ registrantHandle: string }> {
  const c = cfg();
  const networkId = `eip155:${c.chainId}`;
  const verified = process.env.DOMA_VERIFIED_UPLOAD === "true";

  if (verified) {
    const data = await gql<{
      uploadVerifiedRegistrantContacts: {
        proofOfContactsVoucher: { registrantHandle: string };
      };
    }>(
      `mutation UploadVerifiedContact(
        $contact: RegistrantContactInput!
        $networkId: String!
        $registrarIanaId: Int!
      ) {
        uploadVerifiedRegistrantContacts(
          contact: $contact
          networkId: $networkId
          registrarIanaId: $registrarIanaId
        ) {
          proofOfContactsVoucher { registrantHandle }
        }
      }`,
      {
        contact: opts.contact,
        networkId,
        registrarIanaId: opts.registrarIanaId,
      },
    );
    return {
      registrantHandle: data.uploadVerifiedRegistrantContacts.proofOfContactsVoucher.registrantHandle,
    };
  }

  if (!opts.emailVerificationProof) {
    throw Object.assign(
      new Error("emailVerificationProof required (or set DOMA_VERIFIED_UPLOAD=true)"),
      { code: "contacts_required", status: 400 },
    );
  }

  const data = await gql<{
    uploadRegistrantContacts: {
      proofOfContactsVoucher: { registrantHandle: string };
    };
  }>(
    `mutation UploadContact(
      $contact: RegistrantContactInput!
      $emailVerificationProof: String!
      $networkId: String!
      $registrarIanaId: Int!
    ) {
      uploadRegistrantContacts(
        contact: $contact
        emailVerificationProof: $emailVerificationProof
        networkId: $networkId
        registrarIanaId: $registrarIanaId
      ) {
        proofOfContactsVoucher { registrantHandle }
      }
    }`,
    {
      contact: opts.contact,
      emailVerificationProof: opts.emailVerificationProof,
      networkId,
      registrarIanaId: opts.registrarIanaId,
    },
  );
  return {
    registrantHandle: data.uploadRegistrantContacts.proofOfContactsVoucher.registrantHandle,
  };
}

function normalizeBuyer(buyer?: string): string {
  const c = cfg();
  const b = (buyer || process.env.DOMA_BUYER || "").trim();
  if (!b) {
    // default: payer address as buyer
    const pk = process.env.DOMA_PRIVATE_KEY?.trim();
    if (!pk) {
      throw Object.assign(new Error("buyer wallet required"), { code: "bad_request", status: 400 });
    }
    const acct = privateKeyToAccount(pk as Hex);
    return `eip155:${c.chainId}:${acct.address}`;
  }
  if (b.startsWith("eip155:")) return b;
  if (/^0x[a-fA-F0-9]{40}$/.test(b)) return `eip155:${c.chainId}:${getAddress(b)}`;
  throw Object.assign(new Error("buyer must be 0x address or CAIP-10"), {
    code: "bad_request",
    status: 400,
  });
}

function domaChain() {
  const c = cfg();
  return defineChain({
    id: c.chainId,
    name: `Doma ${networkName()}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [c.rpcUrl] } },
    blockExplorers: { default: { name: "Doma", url: c.explorer } },
  });
}

async function payVoucherOnChain(order: {
  voucher: string;
  signature: string;
  paymentContractAddress: string;
}): Promise<{ txHash: Hex }> {
  const pk = process.env.DOMA_PRIVATE_KEY?.trim();
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    throw Object.assign(new Error("DOMA_PRIVATE_KEY not configured"), {
      code: "payer_not_configured",
      status: 503,
    });
  }
  const account = privateKeyToAccount(pk as Hex);
  const chain = domaChain();
  const transport = http(cfg().rpcUrl);
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ account, chain, transport });

  const voucher = JSON.parse(order.voucher) as {
    buyer: string;
    token: string;
    amount: string;
    voucherExpiration: number | string;
    paymentId: string;
    orderId: string;
  };

  const token = getAddress(voucher.token);
  const amount = BigInt(voucher.amount);
  const isNative = token === zeroAddress;
  const marketplace = getAddress(order.paymentContractAddress);

  const voucherStruct = {
    buyer: getAddress(voucher.buyer),
    token,
    amount,
    voucherExpiration: BigInt(voucher.voucherExpiration),
    paymentId: voucher.paymentId,
    orderId: voucher.orderId,
  };

  if (!isNative) {
    const { request } = await publicClient.simulateContract({
      account,
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [marketplace, amount],
    });
    const approveHash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  const { request } = await publicClient.simulateContract({
    account,
    address: marketplace,
    abi: MARKETPLACE_ABI,
    functionName: "pay",
    args: [voucherStruct, order.signature as Hex],
    value: isNative ? amount : BigInt(0),
  });
  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return { txHash };
}

export async function pollOrder(
  orderId: string,
  opts?: { timeoutMs?: number; intervalMs?: number },
): Promise<{ status: string; items?: unknown[]; timedOut?: boolean }> {
  const timeout = opts?.timeoutMs ?? 120_000;
  const interval = opts?.intervalMs ?? 5_000;
  const start = Date.now();
  let last = { status: "UNKNOWN" as string, items: undefined as unknown[] | undefined };

  while (Date.now() - start < timeout) {
    const data = await gql<{
      order: { status: string; items?: Array<{ failureReason?: string; sld?: string; tld?: string }> };
    }>(
      `query Order($orderId: String!) {
        order(orderId: $orderId) {
          status
          items { sld tld status failureReason }
        }
      }`,
      { orderId },
    );
    last = { status: data.order?.status || "UNKNOWN", items: data.order?.items };
    if (["COMPLETED", "FAILED", "PARTIALLY_COMPLETED"].includes(last.status)) {
      return last;
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return { ...last, timedOut: true };
}

export type DomaRegisterResult = {
  brand: "Milypay";
  provider: "doma";
  name: string;
  years: number;
  orderId?: string;
  status: string;
  success: boolean;
  buyer: string;
  chargeUsd: string;
  payTxHash?: string;
  explorerUrl?: string;
  items?: unknown[];
  message?: string;
  fetchedAt: string;
};

/**
 * Full register after x402 settled: contacts → createOrder → on-chain pay → poll.
 */
export async function domaRegister(opts: {
  name: string;
  years?: number;
  buyer?: string;
  contact?: Partial<RegistrantContact>;
  emailVerificationProof?: string;
  registrantHandle?: string;
  poll?: boolean;
}): Promise<DomaRegisterResult> {
  const quote = await domaQuote(opts.name, opts.years ?? 1);
  if (!quote.canRegister || quote.registrarIanaId == null) {
    throw Object.assign(new Error(quote.reason || "cannot register"), {
      code: quote.reason || "cannot_register",
      status: 400,
      quote,
    });
  }

  const buyer = normalizeBuyer(opts.buyer);
  const c = cfg();
  const contact = defaultContact({
    ...opts.contact,
    email: opts.contact?.email || process.env.DOMA_REGISTRANT_EMAIL || "",
  });
  if (!contact.email) {
    throw Object.assign(new Error("registrant email required"), {
      code: "contacts_required",
      status: 400,
    });
  }

  let handle = opts.registrantHandle;
  if (!handle) {
    const up = await uploadContacts({
      contact,
      registrarIanaId: quote.registrarIanaId,
      emailVerificationProof: opts.emailVerificationProof,
    });
    handle = up.registrantHandle;
  }

  const usdc = (process.env.DOMA_USDC_ADDRESS || c.usdc) as Address;
  if (usdc === zeroAddress && networkName() === "mainnet") {
    throw Object.assign(new Error("Set DOMA_USDC_ADDRESS for mainnet"), {
      code: "not_configured",
      status: 503,
    });
  }

  const created = await gql<{
    createOrder:
      | {
          __typename: "CreateOrderSuccess";
          orderId: string;
          totalPayment?: string;
          voucher: string;
          signature: string;
          paymentContractAddress: string;
          voucherExpiresAt?: string;
        }
      | {
          __typename: "CreateOrderValidationError";
          errors: Array<{ domain?: string; reason?: string }>;
        };
  }>(
    `mutation CreateOrder($input: CreateOrderInput!) {
      createOrder(input: $input) {
        __typename
        ... on CreateOrderSuccess {
          orderId totalPayment voucher signature paymentContractAddress voucherExpiresAt
        }
        ... on CreateOrderValidationError {
          errors { domain reason }
        }
      }
    }`,
    {
      input: {
        buyer,
        domains: [{ domain: quote.name, type: "REGISTRATION", years: quote.years }],
        registrarIanaId: quote.registrarIanaId,
        registrantHandle: handle,
        selectedPaymentNetworkId: `eip155:${c.chainId}`,
        selectedPaymentTokenAddress: usdc,
      },
    },
  );

  const order = created.createOrder;
  if (!order || order.__typename === "CreateOrderValidationError") {
    const errs =
      order && "errors" in order
        ? order.errors.map((e) => e.reason || e.domain).join("; ")
        : "createOrder failed";
    throw Object.assign(new Error(errs), { code: "create_order_failed", status: 400 });
  }

  let payTxHash: Hex | undefined;
  try {
    const paid = await payVoucherOnChain(order);
    payTxHash = paid.txHash;
  } catch (e) {
    throw Object.assign(
      new Error(e instanceof Error ? e.message : "on-chain pay failed"),
      {
        code: "doma_pay_failed",
        status: 502,
        orderId: order.orderId,
      },
    );
  }

  let finalStatus = "PAID";
  let items: unknown[] | undefined;
  if (opts.poll !== false) {
    const polled = await pollOrder(order.orderId);
    finalStatus = polled.status;
    items = polled.items;
  }

  const success = finalStatus === "COMPLETED" || finalStatus === "PAID";
  return {
    brand: "Milypay",
    provider: "doma",
    name: quote.name,
    years: quote.years,
    orderId: order.orderId,
    status: finalStatus,
    success,
    buyer,
    chargeUsd: quote.chargeUsd,
    payTxHash,
    explorerUrl: payTxHash ? `${c.explorer}/tx/${payTxHash}` : undefined,
    items,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getOrder(orderId: string) {
  const data = await gql<{
    order: { status: string; items?: unknown[] };
  }>(
    `query Order($orderId: String!) {
      order(orderId: $orderId) {
        status
        items { sld tld status failureReason }
      }
    }`,
    { orderId },
  );
  return {
    brand: "Milypay" as const,
    provider: "doma" as const,
    orderId,
    ...data.order,
    explorer: cfg().explorer,
    fetchedAt: new Date().toISOString(),
  };
}

export function errorToResponse(e: unknown): { status: number; body: Record<string, unknown> } {
  const err = e as {
    message?: string;
    code?: string;
    status?: number;
    quote?: unknown;
    orderId?: string;
    upstream?: unknown;
  };
  return {
    status: typeof err.status === "number" ? err.status : 500,
    body: {
      error: err.message || "Doma error",
      code: err.code || "doma_error",
      brand: "Milypay",
      provider: "doma",
      configured: domaConfigured(),
      payerConfigured: domaPayerConfigured(),
      orderId: err.orderId,
      quote: err.quote,
      setup:
        err.code === "not_configured"
          ? "Set DOMA_API_KEY (https://app-testnet.doma.xyz/account/developers). For register also DOMA_PRIVATE_KEY + fund USDC/ETH on Doma."
          : err.code === "payer_not_configured"
            ? "Set DOMA_PRIVATE_KEY (0x…) and fund with gas + USDC on Doma network"
            : undefined,
      docs: "https://docs.doma.xyz/api-reference/domain-registration",
    },
  };
}
