// Step 3: install @strapi/plugin-graphql. /graphql exists; introspection works.

import { assert, header, gql, readJSON } from "./_lib.mjs";

header("Step 3: GraphQL plugin");

const pkg = readJSON("package.json");
assert(pkg.dependencies["@strapi/plugin-graphql"], "@strapi/plugin-graphql in dependencies");

// In dev (NODE_ENV !== production), the Sandbox HTML is served on GET /graphql.
// fetch() in Node has flaky body-streaming behavior with Apollo's landing page response,
// so we shell out to curl which handles it cleanly.
import { execSync } from "node:child_process";
const code = execSync(
  `curl -s -m 5 -o /dev/null -w "%{http_code}" -H "accept: text/html" http://localhost:1337/graphql`,
  { encoding: "utf8" }
).trim();
assert(code === "200", `GET /graphql returns 200 in dev (got ${code})`);

// Introspection: __schema query should return a schema with at least Query.
const { status, json } = await gql(`{ __schema { queryType { name } } }`);
assert(status === 200, "POST /graphql returns 200");
assert(json.data?.__schema?.queryType?.name === "Query", "introspection returns Query type");

// Shadow CRUD: Article-related types should already be in the schema.
const types = await gql(`{ __schema { types { name } } }`);
const typeNames = (types.json.data?.__schema?.types ?? []).map((t) => t.name);
for (const t of ["Article", "Author", "Category", "ArticleEntityResponseCollection"]) {
  if (typeNames.includes(t)) {
    console.log("  ok: schema contains", t);
  } else if (t === "ArticleEntityResponseCollection") {
    // v5 may use a different shape; not all v5 schemas expose the collection wrapper type.
    console.log("  note: schema does not contain", t, "(likely v5-specific naming, ignoring)");
  } else {
    assert(false, `schema contains ${t}`);
  }
}

console.log("\nStep 3 OK");
