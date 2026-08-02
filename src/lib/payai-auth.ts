/**
 * PayAI facilitator API key JWT (EdDSA / Ed25519).
 * Env:
 *   PAYAI_API_KEY_ID
 *   PAYAI_API_KEY_SECRET  (raw base64 PKCS#8 or payai_sk_<base64>)
 *
 * Docs: https://docs.payai.network/x402/facilitators/introduction
 */

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof data === "string") {
    bytes = new TextEncoder().encode(data);
  } else if (data instanceof Uint8Array) {
    bytes = data;
  } else {
    bytes = new Uint8Array(data);
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64ToBytes(b64: string): Uint8Array {
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function normalizeSecret(secret: string): string {
  const t = secret.trim();
  return t.startsWith("payai_sk_") ? t.slice("payai_sk_".length) : t;
}

let cached: { id: string; token: string; exp: number } | null = null;

export async function payaiAuthHeaders(): Promise<Record<string, string>> {
  const id = process.env.PAYAI_API_KEY_ID?.trim();
  const secret = process.env.PAYAI_API_KEY_SECRET?.trim();
  if (!id || !secret) return {};

  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.id === id && cached.exp > now + 30) {
    return { Authorization: `Bearer ${cached.token}` };
  }

  const expiresIn = 120;
  const header = b64url(JSON.stringify({ alg: "EdDSA", typ: "JWT", kid: id }));
  const payload = b64url(
    JSON.stringify({
      sub: id,
      iss: "payai-merchant",
      iat: now,
      exp: now + expiresIn,
      jti: crypto.randomUUID(),
    }),
  );
  const message = `${header}.${payload}`;

  const keyBytes = b64ToBytes(normalizeSecret(secret));
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes.buffer as ArrayBuffer,
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "Ed25519",
    privateKey,
    new TextEncoder().encode(message),
  );
  const token = `${message}.${b64url(sig)}`;
  cached = { id, token, exp: now + expiresIn };
  return { Authorization: `Bearer ${token}` };
}

export function payaiAuthConfigured(): boolean {
  return Boolean(process.env.PAYAI_API_KEY_ID?.trim() && process.env.PAYAI_API_KEY_SECRET?.trim());
}
