// Step 9b: production-only flags from the post's plugin config.
// Run with NODE_ENV=production. Verifies:
//   landingPage: false in prod  →  GET /graphql does NOT serve the Apollo Sandbox UI
//   apolloServer.introspection: false in prod  →  __schema query is rejected
//
// Pre: Strapi is running on :1337 in production mode.

import { execSync } from "node:child_process";
import { assert, header, gql } from "./_lib.mjs";

header("Step 9b: production flags");

// 1. introspection should be disabled. With apolloServer.introspection=false,
//    Apollo refuses any query that touches __schema or __type.
const intro = await gql(`{ __schema { queryType { name } } }`);
const introErr = intro.json.errors?.[0]?.message ?? "";
assert(/introspection/i.test(introErr), `introspection rejected in production (got: ${introErr})`);

// 2. landingPage in production: GET /graphql still returns 200 (Apollo's prod landing page),
//    but the body is the small static prod page, not the Apollo Sandbox SPA.
//    Compare body sizes: dev Sandbox HTML is large (>100KB); prod landing is small.
const code = execSync(
  `curl -s -m 5 -o /tmp/graphql-body.html -w "%{http_code}" -H "accept: text/html" http://localhost:1338/graphql`,
  { encoding: "utf8" }
).trim();
assert(code === "200", `GET /graphql returns 200 in prod (got ${code})`);
const sizeStr = execSync(`wc -c < /tmp/graphql-body.html`, { encoding: "utf8" }).trim();
const size = Number(sizeStr);
console.log(`  prod /graphql body size: ${size} bytes`);
assert(size > 0 && size < 50_000, `prod landing page is small (${size} bytes); a large body would mean Sandbox is still served`);
const body = execSync(`cat /tmp/graphql-body.html`, { encoding: "utf8" });
assert(!/apollo-sandbox|embedded-sandbox/i.test(body), "prod landing page does not contain Apollo Sandbox markers");

// 3. Normal queries still work in prod (proves the endpoint is functional, just not
//    introspectable / sandboxed).
const articles = await gql(`{ articles { documentId } }`);
assert(Array.isArray(articles.json.data?.articles), "regular queries still work in prod");

console.log("\nStep 9b OK");
