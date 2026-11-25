-- Replay / retry ledger for Helius Rings private payments.
CREATE TABLE IF NOT EXISTS ring_payments (
  tx_signature TEXT PRIMARY KEY,
  payer        TEXT NOT NULL,
  mint         TEXT NOT NULL,
  amount       TEXT NOT NULL,
  required     TEXT NOT NULL,
  resource     TEXT NOT NULL,
  method       TEXT NOT NULL DEFAULT 'GET',
  status       TEXT NOT NULL,            -- 'claimed' (verified, not yet served) | 'served'
  slot         INTEGER,
  block_time   INTEGER,
  claimed_at   INTEGER NOT NULL,         -- unix seconds of first successful verification
  lease_until  INTEGER NOT NULL DEFAULT 0,
  served_at    INTEGER,
  attempts     INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS ring_payments_payer ON ring_payments(payer);
CREATE INDEX IF NOT EXISTS ring_payments_claimed ON ring_payments(claimed_at);

-- Sponsored proof/indexer/RPC proxy usage, for the daily credit caps.
CREATE TABLE IF NOT EXISTS ring_proxy_usage (
  day   TEXT NOT NULL,                   -- UTC yyyy-mm-dd
  key   TEXT NOT NULL,                   -- 'all' or client IP
  kind  TEXT NOT NULL,                   -- 'proof' | 'read'
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, key, kind)
);
