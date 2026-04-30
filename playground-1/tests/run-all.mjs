// Run every step test in order against the currently-running Strapi dev server.
// Step 9b requires NODE_ENV=production and is skipped here; run it manually.

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

const here = new URL("./", import.meta.url).pathname;
const files = readdirSync(here)
  .filter((f) => /^step-\d+/.test(f))
  .filter((f) => !f.startsWith("step-09b"))
  .sort();

let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [here + f], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}

console.log(`\n=== Summary: ${files.length - failed}/${files.length} passed ===`);
process.exit(failed ? 1 : 0);
