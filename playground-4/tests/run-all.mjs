import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

const here = new URL("./", import.meta.url).pathname;
const files = readdirSync(here).filter((f) => /^p4-step-/.test(f)).sort();

let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [here + f], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}

console.log(`\n=== Summary: ${files.length - failed}/${files.length} passed ===`);
process.exit(failed ? 1 : 0);
