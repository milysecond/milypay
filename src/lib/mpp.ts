/**
 * Tempo MPP (Machine Payments Protocol) via mppx.
 * Live path for Tempo agents — complements Solana x402.
 *
 * Env:
 *   TEMPO_MPP=true
 *   TEMPO_PAY_TO=0x…
 *   MPP_SECRET_KEY  (32+ bytes)
 *   MPP_REALM       (default api.milypay.xyz)
 */

import { Mppx, tempo } from "mppx/server";
import { TEMPO_PATHUSD, tempoPayTo } from "./tempo";

// mppx handler surface is heavily generic; keep a narrow runtime shape.
type MppxRuntime = {
  charge: (opts: { amount: string }) => (req: Request) => Promise<{
    status: number;
    challenge?: Response;
    withReceipt: (res: Response) => Response;
  }>;
};

let cached: MppxRuntime | null | undefined;

export function mppEnabled(): boolean {
  return (
    process.env.TEMPO_MPP === "true" &&
    Boolean(tempoPayTo()) &&
    Boolean(process.env.MPP_SECRET_KEY && process.env.MPP_SECRET_KEY.length >= 32)
  );
}

function getMppx(): MppxRuntime | null {
  if (cached !== undefined) return cached;
  if (!mppEnabled()) {
    cached = null;
    return null;
  }
  const recipient = tempoPayTo() as `0x${string}`;
  const currency = (process.env.TEMPO_PATHUSD || TEMPO_PATHUSD) as `0x${string}`;
  const secretKey = process.env.MPP_SECRET_KEY!;
  const realm = process.env.MPP_REALM || "api.milypay.xyz";

  try {
    // tempo.charge registers the charge intent with currency/recipient defaults.
    const instance = Mppx.create({
      realm,
      secretKey,
      methods: [
        tempo.charge({
          currency,
          recipient,
        }),
      ],
    }) as unknown as MppxRuntime;
    cached = instance;
  } catch (e) {
    console.error("mppx init failed", e);
    cached = null;
  }
  return cached;
}

/** True if request carries an MPP Payment credential. */
export function hasMppCredential(req: Request): boolean {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  return /^\s*Payment\b/i.test(auth);
}

export type MppGateResult =
  | { kind: "paid"; withReceipt: (res: Response) => Response }
  | { kind: "challenge"; response: Response }
  | { kind: "skip" }
  | { kind: "error"; response: Response };

/**
 * Run MPP charge for a human amount string (e.g. "0.002").
 */
export async function mppCharge(
  req: Request,
  amount: string,
  opts?: { forceChallenge?: boolean },
): Promise<MppGateResult> {
  const mppx = getMppx();
  if (!mppx) return { kind: "skip" };

  if (!opts?.forceChallenge && !hasMppCredential(req)) {
    const url = new URL(req.url);
    const rail = (url.searchParams.get("rail") || req.headers.get("x-payment-rail") || "").toLowerCase();
    if (rail !== "mpp" && rail !== "tempo") return { kind: "skip" };
  }

  try {
    const result = await mppx.charge({ amount })(req);
    if (result.status === 402) {
      const challenge = result.challenge;
      if (!challenge) {
        return {
          kind: "challenge",
          response: Response.json(
            { error: "Payment Required", code: "mpp_payment_required", protocol: "MPP" },
            { status: 402 },
          ),
        };
      }
      return { kind: "challenge", response: challenge };
    }
    return {
      kind: "paid",
      withReceipt: (res: Response) => {
        try {
          return result.withReceipt(res);
        } catch {
          return res;
        }
      },
    };
  } catch (e) {
    console.error("mpp charge error", e);
    return {
      kind: "error",
      response: Response.json(
        {
          error: "MPP payment failed",
          code: "mpp_error",
          message: e instanceof Error ? e.message : "unknown",
        },
        { status: 502 },
      ),
    };
  }
}

export function mppStatus() {
  return {
    enabled: mppEnabled(),
    realm: process.env.MPP_REALM || "api.milypay.xyz",
    payTo: tempoPayTo(),
    currency: process.env.TEMPO_PATHUSD || TEMPO_PATHUSD,
    protocol: "MPP",
    docs: "https://mpp.dev",
    how: "Authorization: Payment … or ?rail=mpp / X-Payment-Rail: mpp",
  };
}
