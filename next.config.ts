import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Machine-readable x402 discovery manifest. Checked before the host rule
      // so it resolves on every host (milypay.xyz and api.milypay.xyz).
      {
        source: "/.well-known/x402",
        destination: "/api/x402-manifest",
      },
      // api.milypay.xyz/<service>/... -> /api/<service>/...
      // so agents can call https://api.milypay.xyz/au-business/abn/{abn}
      {
        source: "/:path*",
        has: [{ type: "host", value: "api.milypay.xyz" }],
        destination: "/api/:path*",
      },
    ];
  },
};

export default nextConfig;
