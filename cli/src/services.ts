/** Catalogue of Milypay endpoints, generated from /.well-known/x402 (see scripts/gen-services.mjs). */
import { GENERATED_SERVICES } from "./services.generated.js";

export type Service = {
  id: string;
  method: string;
  path: string;
  price: string;
  description: string;
};

export const SERVICES: Service[] = GENERATED_SERVICES;

export const DEMO_BASE = "https://milypay.xyz";
export const API_BASE = "https://api.milypay.xyz";
export const DOCS = "https://milypay.xyz/agents.md";
export const MANIFEST_URL = "https://milypay.xyz/.well-known/x402";
