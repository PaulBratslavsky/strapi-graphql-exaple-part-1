// Part 3 Step 2: Apollo Client wired up. Post says nothing should render
// differently yet (line 166), but the file should compile and the home page
// should still show placeholder data.

import { assert, header, fetchPage, fileContains } from "./_lib.mjs";

header("Part 3 Step 2: Apollo Client");

assert(fileContains("lib/apollo-client.ts", "registerApolloClient"), "apollo-client.ts uses registerApolloClient");
assert(fileContains("lib/apollo-client.ts", "keyFields: [\"documentId\"]"), "Note + Tag are keyed by documentId");
assert(fileContains("lib/apollo-client.ts", '"no-store"'), "fetch cache is set to no-store");
assert(fileContains("lib/apollo-client.ts", "STRAPI_GRAPHQL_URL"), "uses STRAPI_GRAPHQL_URL env var");

// The starter still imports placeholder data, so the home page should still render
// the placeholder titles. Apollo isn't called by any page yet (per post line 166).
const home = await fetchPage("/");
assert(home.status === 200, "GET / still returns 200 after wiring Apollo");
assert(home.text.includes("Placeholder: weekly review"), "home page still shows placeholder title (no page imports apollo yet)");

console.log("\nP3 Step 2 OK");
