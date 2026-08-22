import { openApiResponse } from "@/lib/openapi";

export const dynamic = "force-static";

/** api.milypay.xyz/openapi.json → /api/openapi.json */
export function GET() {
  return openApiResponse();
}
