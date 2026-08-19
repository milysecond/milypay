/**
 * x402 Bazaar discovery extension helpers.
 * Spec: https://github.com/x402-foundation/x402/blob/main/docs/extensions/bazaar.mdx
 *
 * Facilitators (and agentic.market) catalog resources when 402 responses include
 * extensions.bazaar + optional resource.serviceName/tags/iconUrl.
 */

export type BazaarExtension = {
  info: {
    input: Record<string, unknown> & { type: "http"; method: string };
    output?: { type: "json"; example: unknown };
  };
  schema: Record<string, unknown>;
};

const SERVICE_NAME = "Milypay";
const ICON_URL = "https://milypay.xyz/icon.png";
const TAGS = ["australia", "data", "solana", "agents", "x402"];

/** Path segment names for known dynamic routes (last N segments). */
const PATH_PARAM_HINTS: Array<{ match: RegExp; names: string[] }> = [
  { match: /^\/au-energy\/nem\/([^/]+)$/i, names: ["region"] },
  { match: /^\/au-phone\/([^/]+)$/i, names: ["phone"] },
  { match: /^\/au-business\/abn\/([^/]+)$/i, names: ["abn"] },
  { match: /^\/au-company\/acn\/([^/]+)$/i, names: ["acn"] },
  { match: /^\/au-bsb\/([^/]+)$/i, names: ["bsb"] },
  { match: /^\/au-transit\/([^/]+)\/(vehicles|trip-updates|alerts|summary)$/i, names: ["region", "feed"] },
  { match: /^\/au-abs\/dataflow\/([^/]+)$/i, names: ["id"] },
  { match: /^\/au-abs\/data\/([^/]+)$/i, names: ["dataflow"] },
  { match: /^\/au-tracking\/([^/]+)$/i, names: ["id"] },
  { match: /^\/domains\/check$/i, names: [] },
];

function stripApiPrefix(pathname: string): string {
  return pathname.replace(/^\/api(?=\/|$)/, "") || "/";
}

/**
 * Canonical public API URL for discovery (always api.milypay.xyz paid host).
 */
export function bazaarResourceUrl(req: Request): string {
  const u = new URL(req.url);
  let path = stripApiPrefix(u.pathname);
  if (!path.startsWith("/")) path = `/${path}`;
  const q = u.search || "";
  return `https://api.milypay.xyz${path}${q}`;
}

function extractPathParams(pathname: string): {
  pathParams?: Record<string, string>;
  routeTemplate?: string;
} {
  const path = stripApiPrefix(pathname);
  for (const hint of PATH_PARAM_HINTS) {
    const m = path.match(hint.match);
    if (!m) continue;
    if (!hint.names.length) return {};
    const pathParams: Record<string, string> = {};
    hint.names.forEach((n, i) => {
      pathParams[n] = decodeURIComponent(m[i + 1] || "");
    });
    // crude template
    let routeTemplate = path;
    hint.names.forEach((n, i) => {
      const val = m[i + 1];
      if (val) routeTemplate = routeTemplate.replace(val, `:${n}`);
    });
    return { pathParams, routeTemplate };
  }
  return {};
}

function queryParamsFromUrl(url: URL): Record<string, string> {
  const out: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

function inputSchemaForQuery(query: Record<string, string>): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const k of Object.keys(query)) {
    properties[k] = { type: "string", description: `Query parameter ${k}` };
  }
  // common known params even if empty
  if (!Object.keys(properties).length) {
    return { properties: {} };
  }
  return { properties, required: Object.keys(properties) };
}

/**
 * Build extensions.bazaar for a GET-style HTTP resource.
 */
export function buildBazaarExtension(
  req: Request,
  opts?: { method?: string; example?: unknown },
): { bazaar: BazaarExtension } {
  const method = (opts?.method || req.method || "GET").toUpperCase();
  const url = new URL(req.url);
  const query = queryParamsFromUrl(url);
  const { pathParams } = extractPathParams(url.pathname);

  const isBody = ["POST", "PUT", "PATCH"].includes(method);

  if (isBody) {
    return {
      bazaar: {
        info: {
          input: {
            type: "http",
            method,
            bodyType: "json",
            body: {},
            ...(pathParams ? { pathParams } : {}),
          } as BazaarExtension["info"]["input"] & {
            bodyType: string;
            body: Record<string, unknown>;
          },
          ...(opts?.example
            ? { output: { type: "json" as const, example: opts.example } }
            : {
                output: {
                  type: "json" as const,
                  example: { brand: "Milypay", ok: true },
                },
              }),
        },
        schema: {
          $schema: "https://json-schema.org/draft/2020-12/schema",
          type: "object",
          properties: {
            input: {
              type: "object",
              properties: {
                type: { type: "string", const: "http" },
                method: { type: "string", enum: ["POST", "PUT", "PATCH"] },
                bodyType: { type: "string", enum: ["json", "form-data", "text"] },
                body: { type: "object", properties: {} },
              },
              required: ["type", "method", "bodyType", "body"],
              additionalProperties: false,
            },
          },
          required: ["input"],
        },
      },
    };
  }

  // Enrich GET body type field for bazaar — query discovery expects method on info.input
  const infoInput: BazaarExtension["info"]["input"] = {
    type: "http",
    method: method === "HEAD" || method === "DELETE" ? method : "GET",
  };
  if (Object.keys(query).length) infoInput.queryParams = query;
  if (pathParams && Object.keys(pathParams).length) infoInput.pathParams = pathParams;

  const querySchema = inputSchemaForQuery(query);

  return {
    bazaar: {
      info: {
        input: infoInput,
        ...(opts?.example
          ? { output: { type: "json" as const, example: opts.example } }
          : {
              output: {
                type: "json" as const,
                example: {
                  brand: "Milypay",
                  ok: true,
                  note: "Australian agent data over x402",
                },
              },
            }),
      },
      schema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {
          input: {
            type: "object",
            properties: {
              type: { type: "string", const: "http" },
              method: { type: "string", enum: ["GET", "HEAD", "DELETE"] },
              queryParams: {
                type: "object",
                ...querySchema,
              },
              ...(pathParams
                ? {
                    pathParams: {
                      type: "object",
                      properties: Object.fromEntries(
                        Object.keys(pathParams).map((k) => [k, { type: "string" }]),
                      ),
                    },
                  }
                : {}),
            },
            required: ["type", "method"],
            additionalProperties: false,
          },
          output: {
            type: "object",
            properties: {
              type: { type: "string" },
              example: { type: "object" },
            },
            required: ["type"],
          },
        },
        required: ["input"],
      },
    },
  };
}

export function bazaarResourceMeta(description: string) {
  return {
    description: description.slice(0, 500),
    mimeType: "application/json" as const,
    serviceName: SERVICE_NAME, // ≤32 ASCII
    tags: TAGS, // ≤5 tags, ≤32 chars each
    iconUrl: ICON_URL,
  };
}
