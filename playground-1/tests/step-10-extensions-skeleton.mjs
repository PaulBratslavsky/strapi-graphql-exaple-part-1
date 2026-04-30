// Step 10: extensions folder skeleton wired through src/index.ts.
// Post claim: server still boots, schema is unchanged.

import { assert, header, gql, fileExists, readJSON } from "./_lib.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

header("Step 10: extensions skeleton");

// File structure
assert(fileExists("src/extensions/graphql/index.ts"), "aggregator file exists");
const indexTs = readFileSync(join(process.cwd(), "server/src/index.ts"), "utf8");
assert(indexTs.includes("./extensions/graphql"), "src/index.ts imports the aggregator");
assert(indexTs.includes("registerGraphQLExtensions"), "src/index.ts calls registerGraphQLExtensions");

// Server still serves the GraphQL endpoint with the existing CRUD surface.
const articles = await gql(`{ articles { documentId } }`);
assert(Array.isArray(articles.json.data?.articles), "articles still return after wiring extensions");

// Schema is still introspectable in dev (we are back to NODE_ENV=development).
const intro = await gql(`{ __schema { queryType { name } } }`);
assert(!intro.json.errors, "introspection still works in dev");

console.log("\nStep 10 OK");
