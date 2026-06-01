import type { MetadataRoute } from "next";

const BASE = "https://milypay.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-05-31");
  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/stables`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/contact`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}
