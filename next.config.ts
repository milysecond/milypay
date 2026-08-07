import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
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
