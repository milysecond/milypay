import type { MetadataRoute } from "next";

const BASE = "https://milypay.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${BASE}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/demo`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/docs`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/quickstart`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/status`, lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/pay`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/stables`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/agents.md`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/llms.txt`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/llms-full.txt`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/.well-known/x402`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/.well-known/api-catalog`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/openapi.json`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/mcp`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/dashboard`, lastModified, changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE}/fund`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/abn-lookup-api`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/bsb-api`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/asic-company-api`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/gnaf-address-api`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/pricing`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/changelog`, lastModified, changeFrequency: "weekly", priority: 0.6 },
  ];
}
