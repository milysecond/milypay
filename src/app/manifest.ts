import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MilyPay",
    short_name: "MilyPay",
    description:
      "Agent payments and Australian data on x402. Settled in AUD stablecoins. A Milysec company.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0f0a",
    theme_color: "#0a0f0a",
    icons: [
      { src: "/icon.png", sizes: "256x256", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
