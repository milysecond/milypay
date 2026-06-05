"use client";

import { Buffer } from "buffer";
// @solana/web3.js expects a Buffer global in the browser.
if (typeof globalThis !== "undefined") {
  (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer ||= Buffer;
}

import "@solana/wallet-adapter-react-ui/styles.css";
import { useEffect, useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { createX402Client } from "x402-solana/client";

const AUDD_MINT = new PublicKey("AUDDttiEpCydTm7joUMbYddm72jAWXZnCpPZtDoxqBSw");

// Public Solana mainnet RPC for wallet operations. Swap for a dedicated RPC for production.
const RPC = "https://solana-rpc.publicnode.com";

function PayInner() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [bal, setBal] = useState<{ sol: number; audd: number } | null>(null);
  const [status, setStatus] = useState<{ float: { usdc: number }; receiving: { audd: number } } | null>(null);
  const [abn, setAbn] = useState("33051775556");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const pk = wallet.publicKey;
    if (!pk) {
      setBal(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [lamports, tokens] = await Promise.all([
          connection.getBalance(pk),
          connection.getParsedTokenAccountsByOwner(pk, { mint: AUDD_MINT }),
        ]);
        const audd = tokens.value.reduce(
          (s, a) => s + (a.account.data.parsed.info.tokenAmount.uiAmount || 0),
          0,
        );
        if (!cancelled) setBal({ sol: lamports / 1e9, audd });
      } catch {
        if (!cancelled) setBal(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet.publicKey, connection]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [tx, setTx] = useState<string | null>(null);

  async function payAndCall() {
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      setError("Connect a wallet first.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    setTx(null);
    try {
      const client = createX402Client({
        wallet: {
          address: wallet.publicKey.toString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          signTransaction: async (t: any) => await wallet.signTransaction!(t),
        },
        network: "solana",
        rpcUrl: RPC,
        amount: BigInt(1_000_000), // max 1 AUDD safety limit (calls cost ~0.002)
      });
      const res = await client.fetch(
        `https://api.milypay.xyz/au-business/abn/${encodeURIComponent(abn.trim())}`,
      );
      const json = await res.json();
      setData(json);
      const pr = res.headers.get("PAYMENT-RESPONSE");
      if (pr) {
        try {
          const s = JSON.parse(atob(pr)) as Record<string, string>;
          setTx(s.transaction || s.signature || s.txHash || null);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed or was rejected.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <WalletMultiButton />
        {wallet.publicKey && (
          <div className="text-right text-xs text-muted">
            <div>
              {wallet.publicKey.toString().slice(0, 4)}…{wallet.publicKey.toString().slice(-4)}
            </div>
            {bal && (
              <div className="mt-0.5">
                <span className="text-brand-green">{bal.audd.toFixed(2)} AUDD</span>
                <span> · {bal.sol.toFixed(3)} SOL</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <label className="text-sm text-muted">ABN to look up (costs 0.002 AUDD)</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            value={abn}
            onChange={(e) => setAbn(e.target.value)}
            placeholder="e.g. 33051775556"
            className="flex-1 rounded-full border border-border-brand bg-card px-5 py-3 text-fg outline-none placeholder:text-muted/50 focus:border-brand-green"
          />
          <button
            type="button"
            onClick={payAndCall}
            disabled={loading || !wallet.connected}
            className="rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Paying…" : wallet.connected ? "Pay & look up" : "Connect wallet"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          This pays the live x402 fee in AUDD on Solana via PayAI, then calls{" "}
          <code className="text-fg">api.milypay.xyz</code>. You need AUDD in the connected wallet.
        </p>
      </div>

      <div className="mt-6">
        {error && <div className="card p-5 text-sm text-brand-purple">{error}</div>}
        {tx && (
          <a
            href={`https://solscan.io/tx/${tx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 block text-xs text-brand-green hover:underline"
          >
            Paid. View settlement on Solscan -&gt;
          </a>
        )}
        {data && (
          <pre className="overflow-x-auto rounded-lg border border-border-brand bg-bg p-4 text-xs leading-relaxed text-fg">
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
        )}
      </div>

      {status && (
        <p className="mt-10 border-t border-border-brand pt-5 text-center text-xs text-muted">
          Service float{" "}
          <span className="text-fg">{status.float.usdc.toFixed(2)} USDC</span>
          {" · "}received <span className="text-fg">{status.receiving.audd.toFixed(2)} AUDD</span>
        </p>
      )}
    </div>
  );
}

export default function WalletPayDemo() {
  const endpoint = useMemo(() => RPC, []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <PayInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
