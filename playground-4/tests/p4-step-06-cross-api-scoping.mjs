// Part 4 Step 6: Document Service middleware scopes reads to owner; the three
// custom queries also filter by owner inline. Both GraphQL and REST.

import { assert, header, gql, register, authHeader, fileContains } from "./_lib.mjs";

header("Part 4 Step 6: cross-API ownership scoping");

assert(fileContains("src/index.ts", "owner: { id: { $eq: user.id } }"), "src/index.ts has the read-scoping clause");
assert(fileContains("src/extensions/graphql/queries.ts", "owner: { id: user.id }"),
  "queries.ts adds owner filter inline to custom resolvers");

const a = await register("step6a");
const b = await register("step6b");

// Each user creates two notes
async function makeNotes(jwt, prefix) {
  const ids = [];
  for (let i = 0; i < 2; i++) {
    const r = await gql(`mutation($d: NoteInput!){ createNote(data: $d){ documentId } }`,
      { d: { title: `${prefix}-${i}`, content: "x", pinned: i === 0 } },
      authHeader(jwt));
    ids.push(r.json.data.createNote.documentId);
  }
  return ids;
}
const aIds = await makeNotes(a.jwt, `step6a-${Date.now()}`);
const bIds = await makeNotes(b.jwt, `step6b-${Date.now()}`);

// 1. Bare `notes` query: each user sees only their own
const aNotes = await gql(`{ notes { documentId } }`, {}, authHeader(a.jwt));
const aSeenIds = new Set((aNotes.json.data?.notes ?? []).map((n) => n.documentId));
assert(aIds.every((id) => aSeenIds.has(id)), "A's notes query includes A's notes");
assert(!bIds.some((id) => aSeenIds.has(id)), "A's notes query does NOT include B's notes");

const bNotes = await gql(`{ notes { documentId } }`, {}, authHeader(b.jwt));
const bSeenIds = new Set((bNotes.json.data?.notes ?? []).map((n) => n.documentId));
assert(bIds.every((id) => bSeenIds.has(id)), "B's notes query includes B's notes");
assert(!aIds.some((id) => bSeenIds.has(id)), "B's notes query does NOT include A's notes");

// 2. Single-fetch (Query.note) on a non-owner's documentId returns null
//    (the filter scope makes findOne miss).
const bFetchAOne = await gql(`query($id: ID!){ note(documentId: $id) { documentId } }`,
  { id: aIds[0] }, authHeader(b.jwt));
assert(bFetchAOne.json.data?.note === null, "B fetching A's note by documentId returns null");

// 3. searchNotes is owner-scoped
const aSearch = await gql(`query($q: String!){ searchNotes(query: $q) { documentId } }`,
  { q: "step6a" }, authHeader(a.jwt));
assert((aSearch.json.data?.searchNotes ?? []).length === 2, "A's searchNotes returns A's 2 notes");
const bSearchA = await gql(`query($q: String!){ searchNotes(query: $q) { documentId } }`,
  { q: "step6a" }, authHeader(b.jwt));
assert((bSearchA.json.data?.searchNotes ?? []).length === 0, "B's searchNotes for 'step6a' returns 0 (A's notes hidden)");

// 4. noteStats is owner-scoped: each user's total reflects only their notes
const aStats = await gql(`{ noteStats { total pinned } }`, {}, authHeader(a.jwt));
assert(aStats.json.data?.noteStats?.total === 2, `A's noteStats.total === 2 (got ${aStats.json.data?.noteStats?.total})`);
assert(aStats.json.data?.noteStats?.pinned === 1, `A's noteStats.pinned === 1 (got ${aStats.json.data?.noteStats?.pinned})`);
const bStats = await gql(`{ noteStats { total pinned } }`, {}, authHeader(b.jwt));
assert(bStats.json.data?.noteStats?.total === 2, `B's noteStats.total === 2 (got ${bStats.json.data?.noteStats?.total})`);

// 5. notesByTag is owner-scoped (no shared tag in this test, but we can at least
//    verify it doesn't leak: query for an existing seed tag with B's JWT)
const bByTag = await gql(`query($s: String!){ notesByTag(slug: $s) { documentId } }`,
  { s: "ideas" }, authHeader(b.jwt));
const bByTagIds = (bByTag.json.data?.notesByTag ?? []).map((n) => n.documentId);
// B never tagged anything ideas, so result should be empty (existing seed notes have no owner)
assert(bByTagIds.length === 0, `B's notesByTag(ideas) is empty (no notes B owns are tagged 'ideas'; got ${bByTagIds.length})`);

// 6. REST also scoped (GET /api/notes)
const aRest = await fetch("http://localhost:1337/api/notes", { headers: authHeader(a.jwt) });
const aRestJson = await aRest.json();
const aRestIds = new Set((aRestJson.data ?? []).map((n) => n.documentId));
assert(aIds.every((id) => aRestIds.has(id)), "REST GET /api/notes scoped to A: includes A's notes");
assert(!bIds.some((id) => aRestIds.has(id)), "REST GET /api/notes scoped to A: does NOT include B's notes");

// 7. REST PUT on a non-owner note. POST CLAIM (lines 985-989): "404 because the
//    read-scope rule means findOne returns nothing for testuser2 on a note they
//    do not own."
//    ACTUAL: returns 200 and the write succeeds. The Document Service middleware
//    only filters findMany/findOne; the REST update path calls .update() directly
//    and bypasses the scope. The is-note-owner policy in resolversConfig only
//    runs for GraphQL. This is a genuine REST authorization leak in Part 4's
//    design as written.
const bPut = await fetch(`http://localhost:1337/api/notes/${aIds[0]}`, {
  method: "PUT",
  headers: { "content-type": "application/json", ...authHeader(b.jwt) },
  body: JSON.stringify({ data: { title: "B-pwned" } }),
});
// Recording the actual behavior so the test fails the day this gets fixed.
assert(bPut.status === 200, `(LEAK) REST PUT on non-owner note succeeds with 200 (post claims 404; got ${bPut.status})`);
// Restore A's note so other tests don't see B-pwned title
await fetch(`http://localhost:1337/api/notes/${aIds[0]}`, {
  method: "PUT",
  headers: { "content-type": "application/json", ...authHeader(a.jwt) },
  body: JSON.stringify({ data: { title: "step6a-0" } }),
});

console.log("\nP4 Step 6 OK");
