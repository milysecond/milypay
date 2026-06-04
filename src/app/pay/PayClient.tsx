"use client";

import dynamic from "next/dynamic";

const WalletPayDemo = dynamic(() => import("./WalletPayDemo"), {
  ssr: false,
  loading: () => <div className="py-20 text-center text-sm text-muted">Loading wallet…</div>,
});

export default function PayClient() {
  return <WalletPayDemo />;
}
