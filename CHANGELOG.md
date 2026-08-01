# Changelog

## 0.2.0 — 2026-08-02

### CLI / MCP (`milypay`)
- First-party MCP stdio server: `npx milypay mcp` (17 tools)
- Claude/Cursor config documented
- Free demo host + paid API host modes

### Site
- `/status` public health page + deep probes (`/api/status?deep=1`)
- `/quickstart` paste-ready MCP setup
- Stable API error shape (`code`, `brand`, `docs`)
- Paid responses attach `$receipt` + `X-Milypay-Tx` / explorer URL when settlement returns a signature
- pay.sh provider YAML scaffold in `pay.sh/milypay.yaml`

### SDK
- `milypay-sdk` (unscoped; `@milypay` org TBD) TypeScript client (`packages/sdk`)

## 0.1.0 — 2026-08-01

- Initial `milypay` CLI on npm
- Demo + paid x402 call paths
