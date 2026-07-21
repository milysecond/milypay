import type { MetadataRoute } from "next";

// Milypay is an agent-native service. AI agents and crawlers are explicitly welcome.
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Googlebot",
  "Applebot",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "Amazonbot",
  "meta-externalagent",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Every named AI agent: full access.
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/" })),
      // Everyone else: allow all, keep the POST-only form endpoint out of indexes.
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: "https://milypay.xyz/sitemap.xml",
    host: "https://milypay.xyz",
  };
}
