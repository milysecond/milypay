// Milypay keep-warm worker.
// Runs every 5 minutes (cron) and pings the address endpoint so the Turso G-NAF
// database stays hydrated and avoids cold-start latency. Address only - no ABR
// quota is spent (G-NAF is served from our own Turso DB).

export default {
  async scheduled(_event, _env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          await fetch(
            "https://api.milypay.xyz/au-address/validate?q=1%20bligh%20st%20sydney",
            { headers: { "user-agent": "milypay-keepwarm" } },
          );
        } catch {
          // best-effort; nothing to do on failure
        }
      })(),
    );
  },
};
