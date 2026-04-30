// Step 5: publish the seeded Article drafts.
// Post does this via the admin UI bulk action. We replicate the same outcome
// by calling the admin Content Manager API for each draft article, then
// verify via SQLite that publishedAt is populated.

import { execSync } from "node:child_process";
import { assert, header } from "./_lib.mjs";

header("Step 5: publish seeded articles");

// Login as admin to get a JWT.
const login = await fetch("http://localhost:1338/admin/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@test.local", password: "Testing123!" }),
});
const { data } = await login.json();
const token = data.token;
assert(typeof token === "string", "got admin JWT");

// Pull all article documentIds from the DB (faster + clearer than paging the admin API)
const ids = execSync(
  `sqlite3 /Users/paul/work/blog/graphql-customization/playground/server/.tmp/data.db "SELECT DISTINCT document_id FROM articles;"`,
  { encoding: "utf8" }
).trim().split("\n").filter(Boolean);

assert(ids.length >= 5, `found ${ids.length} article documents (expected >= 5)`);

let published = 0;
for (const id of ids) {
  const r = await fetch(
    `http://localhost:1338/content-manager/collection-types/api::article.article/${id}/actions/publish`,
    { method: "POST", headers: { authorization: `Bearer ${token}` } }
  );
  if (r.status === 200) {
    published++;
  } else {
    const body = await r.text();
    console.error("  publish failed for", id, r.status, body.slice(0, 200));
  }
}
assert(published === ids.length, `published all ${ids.length} articles`);

// Verify publishedAt is now non-null for at least one row per documentId.
const stillDrafts = execSync(
  `sqlite3 /Users/paul/work/blog/graphql-customization/playground/server/.tmp/data.db "SELECT COUNT(*) FROM articles WHERE published_at IS NULL AND document_id NOT IN (SELECT document_id FROM articles WHERE published_at IS NOT NULL);"`,
  { encoding: "utf8" }
).trim();
assert(stillDrafts === "0", `every article has at least one published version (orphan drafts: ${stillDrafts})`);

console.log("\nStep 5 OK");
