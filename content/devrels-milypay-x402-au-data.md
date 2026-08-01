# Project: Milypay — Australian data for AI agents over x402

**One-liner:** Give any agent pay-per-call access to ABR, ASIC, G-NAF, super, weather, BSB, and postage — settled in AUDD on Solana, no API keys.

## Why

Agents that operate in Australia still hit a wall: government data is fragmented, API keys don't fit autonomous loops, and USDC-only rails force an FX hop. Milypay is the AUD-native x402 provider for that stack.

## What shipped

| Surface | How |
|---------|-----|
| HTTP API | `https://api.milypay.xyz` + x402 |
| Free demo | `https://milypay.xyz/api/*` (throttled) |
| CLI | `npx milypay abn 51824753556` |
| MCP | `npx milypay mcp` |
| SDK | `npm i milypay-sdk` |

## Claude / Cursor (60s)

```json
{
  "mcpServers": {
    "milypay": {
      "command": "npx",
      "args": ["-y", "milypay", "mcp"],
      "env": { "MILYPAY_HOST": "demo" }
    }
  }
}
```

## Paid path

```bash
export MILYPAY_PRIVATE_KEY=<base58>
npx milypay --api abn 51824753556
```

Successful paid calls return `$receipt` with Solana signature + Solscan URL when the facilitator settles.

## Links

- https://milypay.xyz
- https://milypay.xyz/quickstart
- https://milypay.xyz/agents.md
- https://milypay.xyz/status
- npm: `milypay`, `milypay-sdk`

*Draft for DevRels / Telegraph — not published.*
