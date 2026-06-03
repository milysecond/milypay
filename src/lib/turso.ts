// Minimal Turso/libSQL client over the HTTP pipeline API (fetch only, Workers-native).
// Used by both the G-NAF address DB and the ASIC company DB, each with its own
// URL + token env vars.

type Cell = { type: "text" | "integer" | "float" | "null" | "blob"; value?: string | number };

function arg(v: string | number): Cell {
  if (typeof v === "number")
    return Number.isInteger(v) ? { type: "integer", value: String(v) } : { type: "float", value: v };
  return { type: "text", value: v };
}

function cellValue(c: Cell): string | number | null {
  if (c.type === "null") return null;
  if (c.type === "float") return typeof c.value === "number" ? c.value : Number(c.value);
  if (c.type === "integer") return c.value === undefined ? null : Number(c.value);
  return c.value === undefined ? null : (c.value as string);
}

export async function tursoQuery<T = Record<string, unknown>>(
  baseUrl: string | undefined,
  token: string | undefined,
  sql: string,
  args: (string | number)[],
): Promise<T[]> {
  if (!baseUrl) throw new Error("TURSO database URL is not configured");
  const url = baseUrl.replace(/^libsql:\/\//, "https://").replace(/\/$/, "") + "/v2/pipeline";
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token || ""}`, "content-type": "application/json" },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt: { sql, args: args.map(arg) } },
        { type: "close" },
      ],
    }),
  });
  if (!res.ok) throw new Error(`TURSO http ${res.status}`);
  const data = (await res.json()) as {
    results: {
      type: string;
      response?: { result?: { cols: { name: string }[]; rows: Cell[][] } };
      error?: { message: string };
    }[];
  };
  const r = data.results?.[0];
  if (!r || r.type !== "ok" || !r.response?.result) {
    throw new Error(`TURSO query failed: ${r?.error?.message || "unknown"}`);
  }
  const cols = r.response.result.cols.map((c) => c.name);
  return r.response.result.rows.map(
    (row) => Object.fromEntries(row.map((cell, i) => [cols[i], cellValue(cell)])) as T,
  );
}
