// Part 3 Step 3: home page now renders live notes from Strapi.
// Post (line 355): "The home page now shows the notes you seeded in Part 2."

import { assert, header, fetchPage, gql } from "./_lib.mjs";

header("Part 3 Step 3: home page query");

// First, get the expected note titles from GraphQL (so the test stays in sync
// with whatever the seed produced).
const seedQuery = await gql(`{ notes(sort: ["pinned:desc","updatedAt:desc"]) { title pinned } }`);
const seedNotes = seedQuery.json.data?.notes ?? [];
assert(seedNotes.length > 0, `GraphQL backend has notes (got ${seedNotes.length})`);

const home = await fetchPage("/");
assert(home.status === 200, "GET / returns 200");
assert(!home.text.includes("Placeholder: weekly review"), "no longer renders placeholder titles");
// Next.js streams the count as a separate RSC token (`[7,\" active...\"]`),
// so the count and the literal text don't appear concatenated. Just verify
// the seed count is referenced in the streamed payload.
assert(home.text.includes(`[${seedNotes.length},`), `RSC payload references the live count (${seedNotes.length})`);

// Check each seeded title appears in the rendered HTML.
let titlesFound = 0;
for (const n of seedNotes) {
  if (home.text.includes(n.title)) titlesFound++;
}
assert(titlesFound === seedNotes.length, `every seeded title rendered (${titlesFound}/${seedNotes.length})`);

// Pinned-first ordering: the first occurrence of any pinned title should appear
// before the first occurrence of any non-pinned title in the HTML.
const pinned = seedNotes.find((n) => n.pinned);
const unpinned = seedNotes.find((n) => !n.pinned);
if (pinned && unpinned) {
  const ip = home.text.indexOf(pinned.title);
  const iu = home.text.indexOf(unpinned.title);
  assert(ip < iu, `pinned "${pinned.title}" rendered before unpinned "${unpinned.title}" (pinned-first sort)`);
}

console.log("\nP3 Step 3 OK");
