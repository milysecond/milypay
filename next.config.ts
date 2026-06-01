import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
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
