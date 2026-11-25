#!/usr/bin/env node
// Write src/version.ts from package.json so the CLI version and user-agent never drift.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
writeFileSync(
  join(root, "src", "version.ts"),
  `// AUTO-GENERATED from package.json by scripts/gen-version.mjs (runs before build).\nexport const VERSION = ${JSON.stringify(version)};\nexport const USER_AGENT = \`milypay-cli/\${VERSION}\`;\n`,
);
console.log("version", version);
