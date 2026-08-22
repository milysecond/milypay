import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // mppx/viem are large; keep optional server external for node, webpack still bundles for CF.
  serverExternalPackages: [],
  // Force webpack so vendored gtfs-realtime-bindings resolve cleanly on OpenNext/CF.
  // (Turbopack alias paths were rejecting absolute vendor paths.)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "gtfs-realtime-bindings": path.resolve(
        __dirname,
        "vendor/gtfs-realtime-bindings/gtfs-realtime.js",
      ),
      protobufjs: path.resolve(__dirname, "vendor/protobufjs"),
      "protobufjs/minimal": path.resolve(__dirname, "vendor/protobufjs/minimal.js"),
      long: path.resolve(__dirname, "vendor/long/index.js"),
    };
    // mppx pulls node:http types; ignore optional native bits
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  async redirects() {
    return [
      { source: "/sitemap", destination: "/sitemap.xml", permanent: true },
      { source: "/sitemap/", destination: "/sitemap.xml", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/home/", destination: "/", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/x402",
        destination: "/api/x402-manifest",
      },
      {
        source: "/.well-known/api-catalog",
        destination: "/api/api-catalog",
      },
      {
        source: "/openapi.json",
        destination: "/api/openapi",
      },
      {
        source: "/openapi",
        destination: "/api/openapi",
      },
      {
        source: "/server.json",
        destination: "/api/mcp-server-card",
      },
      {
        source: "/mcp/server-card",
        destination: "/api/mcp-server-card",
      },
      {
        source: "/.well-known/mcp/server-card.json",
        destination: "/api/mcp-server-card",
      },
      {
        source: "/googleb787913ba29840de.html",
        destination: "/api/gsc-verify",
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "api.milypay.xyz" }],
        destination: "/api/:path*",
      },
    ];
  },
};

export default nextConfig;
