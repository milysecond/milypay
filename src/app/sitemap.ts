import type { MetadataRoute } from "next";

const BASE = "https://milypay.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-06-14");
  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/demo`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/docs`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/pay`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/stables`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/contact`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    // Machine-readable agent references, surfaced for AI crawlers.
    { url: `${BASE}/agents.md`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/llms.txt`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/llms-full.txt`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/.well-known/x402`, lastModified, changeFrequency: "weekly", priority: 0.7 },
  ];
}
