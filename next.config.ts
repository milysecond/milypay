import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["gtfs-realtime-bindings", "protobufjs"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "gtfs-realtime-bindings": path.join(
        __dirname,
        "vendor/gtfs-realtime-bindings/gtfs-realtime.js",
      ),
      protobufjs: path.join(__dirname, "vendor/protobufjs"),
      "protobufjs/minimal": path.join(__dirname, "vendor/protobufjs/minimal.js"),
    };
    return config;
  },
  async redirects() {
    return [
      // Soft landings for common crawl junk / mistaken paths
      { source: "/sitemap", destination: "/sitemap.xml", permanent: true },
      { source: "/sitemap/", destination: "/sitemap.xml", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/home/", destination: "/", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Machine-readable x402 discovery manifest. Checked before the host rule
      // so it resolves on every host (milypay.xyz and api.milypay.xyz).
      {
        source: "/.well-known/x402",
        destination: "/api/x402-manifest",
      },
      // Google Search Console HTML file verification (served via API route to
      // avoid Cloudflare Workers asset layer stripping the .html extension).
      {
        source: "/googleb787913ba29840de.html",
        destination: "/api/gsc-verify",
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
