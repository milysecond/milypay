import { openApiResponse } from "@/lib/openapi";

export const dynamic = "force-static";

/** GET /api/openapi → also rewritten to /openapi.json */
export function GET() {
  return openApiResponse();
}
