# pay.sh provider listing

Milypay is **not yet** in the live pay-skills catalog (checked 2026-08-02).

## Spec

`milypay.yaml` — proxy gateway to `https://api.milypay.xyz/`.

## Local test

```bash
pay --sandbox gate api pay.sh/milypay.yaml
# other terminal:
pay --sandbox curl http://127.0.0.1:1402/au-business/abn/51824753556
```

## Publish to catalog

Per pay.sh docs: create/validate provider metadata and open a PR to the pay-skills registry (or use org listing flow).

```bash
pay skills add <github-org/repo-with-provider-md>
pay skills update
```

Until listed, agents should use:

- direct API: `api.milypay.xyz`
- MCP: `npx milypay mcp`
- CLI: `npx milypay`
