import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ops | Milypay",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/ops" },
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
