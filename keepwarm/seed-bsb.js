#!/usr/bin/env node
// Seed the Milypay BSB Turso database from the AusPayNet public bulk download.
// Run manually or on the first business day of each month to refresh.
//
// Usage:
//   TURSO_BSB_URL=libsql://... TURSO_BSB_AUTH_TOKEN=... node keepwarm/seed-bsb.js
//
// The script:
//   1. Downloads BSBDirectoryFull.csv and the bank name reference CSV from AusPayNet.
//   2. Creates the bsb table (and drops+recreates if already present).
//   3. Batch-inserts all rows via the Turso HTTP pipeline API.
//
// Prereqs: Node 18+, no extra packages (uses built-in fetch).

const FULL_CSV = "https://auspaynetbsbpublic.blob.core.windows.net/bsb-reports/BSBDirectoryFull.csv";
const KEY_CSV  = "https://auspaynetbsbpublic.blob.core.windows.net/bsb-reports/key%20to%20abbreviations%20and%20bsb%20numbers.csv";

const BSB_URL   = process.env.TURSO_BSB_URL;
const BSB_TOKEN = process.env.TURSO_BSB_AUTH_TOKEN;

if (!BSB_URL || !BSB_TOKEN) {
  console.error("Set TURSO_BSB_URL and TURSO_BSB_AUTH_TOKEN");
  process.exit(1);
}

function tursoUrl(base) {
  return base.replace(/^libsql:\/\//, "https://").replace(/\/$/, "") + "/v2/pipeline";
}

async function turso(requests) {
  const res = await fetch(tursoUrl(BSB_URL), {
    method: "POST",
    headers: { Authorization: `Bearer ${BSB_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ requests: [...requests, { type: "close" }] }),
  });
  if (!res.ok) throw new Error(`Turso HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  for (const r of data.results) {
    if (r.type === "error") throw new Error(`Turso error: ${r.error?.message}`);
  }
  return data.results;
}

async function execute(sql, args = []) {
  return turso([{ type: "execute", stmt: { sql, args: args.map(v =>
    v === null ? { type: "null" } : { type: "text", value: String(v) }
  ) } }]);
}

// Parse an unquoted/quoted CSV line (handles commas inside quotes).
function parseCsvLine(line) {
  const fields = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      fields.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur.trim());
  return fields;
}

async function download(url) {
  const res = await fetch(url, { headers: { "user-agent": "milypay-bsb-seed/1.0" } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

(async () => {
  console.log("Downloading BSB full CSV...");
  const fullCsv = await download(FULL_CSV);
  const bsbLines = fullCsv.split(/\r?\n/).filter(Boolean);
  console.log(`  ${bsbLines.length} BSB rows`);

  console.log("Downloading bank name reference CSV...");
  const keyCsv = await download(KEY_CSV);
  const keyLines = keyCsv.split(/\r?\n/).slice(1).filter(Boolean); // skip header

  // Build mnemonic -> full name map (take first occurrence per mnemonic).
  const bankNames = new Map();
  for (const line of keyLines) {
    const [mnemonic, name] = parseCsvLine(line);
    if (mnemonic && name && !bankNames.has(mnemonic)) {
      bankNames.set(mnemonic.trim(), name.trim());
    }
  }
  console.log(`  ${bankNames.size} bank name mappings`);

  console.log("Recreating bsb table...");
  await execute("DROP TABLE IF EXISTS bsb");
  await execute(`
    CREATE TABLE bsb (
      bsb      TEXT NOT NULL UNIQUE,
      bank     TEXT NOT NULL,
      bank_name TEXT,
      branch   TEXT NOT NULL,
      address  TEXT,
      suburb   TEXT,
      state    TEXT,
      postcode TEXT,
      services TEXT
    )
  `);
  await execute("CREATE INDEX bsb_bank ON bsb(bank)");
  await execute("CREATE INDEX bsb_suburb ON bsb(suburb, state)");

  // Parse BSB rows. No header row in the file.
  // Fields: BSB Code, Bank, Branch Name, Address, Suburb, State, Postcode, Services
  const rows = [];
  for (const line of bsbLines) {
    const f = parseCsvLine(line);
    if (f.length < 7) continue;
    const [bsb, bank, branch, address, suburb, state, postcode, services = ""] = f;
    if (!bsb || !bank) continue;
    rows.push([bsb, bank, bankNames.get(bank) || null, branch, address, suburb, state, postcode, services]);
  }
  console.log(`Inserting ${rows.length} rows in batches...`);

  // Turso pipeline: batch 200 rows per request to stay within limits.
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const requests = chunk.map(([bsb, bank, bank_name, branch, address, suburb, state, postcode, services]) => ({
      type: "execute",
      stmt: {
        sql: "INSERT OR REPLACE INTO bsb(bsb, bank, bank_name, branch, address, suburb, state, postcode, services) VALUES (?,?,?,?,?,?,?,?,?)",
        args: [bsb, bank, bank_name, branch, address, suburb, state, postcode, services].map(v =>
          v === null ? { type: "null" } : { type: "text", value: String(v) }
        ),
      },
    }));
    await turso(requests);
    if ((i / BATCH) % 10 === 0) process.stdout.write(`  ${i + chunk.length}/${rows.length}\r`);
  }

  console.log(`\nDone. ${rows.length} BSB records seeded.`);

  // Quick sanity check.
  const check = await execute("SELECT COUNT(*) as n FROM bsb");
  const n = check[0]?.response?.result?.rows?.[0]?.[0]?.value;
  console.log(`Row count in DB: ${n}`);
})().catch(e => { console.error(e.message); process.exit(1); });
