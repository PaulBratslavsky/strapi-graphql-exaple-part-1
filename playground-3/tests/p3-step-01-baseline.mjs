// Part 3 Step 1: starter is checked out, placeholder data is rendered.
// Post (line 80): "You should see three placeholder notes, a nav bar with
// Notes / Search / Stats / New links."

import { assert, header, fetchPage, fileExists } from "./_lib.mjs";

header("Part 3 Step 1: baseline starter");

assert(fileExists("lib/placeholder.ts"), "lib/placeholder.ts exists");
assert(fileExists("lib/apollo-client.ts"), "lib/apollo-client.ts exists (currently a stub)");
assert(fileExists("lib/graphql.ts"), "lib/graphql.ts exists (currently empty)");
assert(fileExists("scripts/seed.mjs"), "scripts/seed.mjs ships with the starter");
assert(fileExists("scripts/test-graphql.mjs"), "scripts/test-graphql.mjs ships with the starter");

const home = await fetchPage("/");
assert(home.status === 200, "GET / returns 200");
assert(home.text.includes("Placeholder: weekly review"), "home page renders the first placeholder note title");
assert(home.text.includes("Placeholder: gift ideas"), "home page renders the second placeholder note title");
assert(home.text.includes("Placeholder: side-project backlog"), "home page renders the third placeholder note title");
// Nav bar links per post line 80
for (const path of ["/", "/search", "/stats", "/notes/new"]) {
  assert(home.text.includes(`href="${path}"`), `home page contains nav link to ${path}`);
}

// Other pages should be reachable too
for (const path of ["/search", "/stats"]) {
  const r = await fetchPage(path);
  assert(r.status === 200, `GET ${path} returns 200`);
}

console.log("\nP3 Step 1 OK");
