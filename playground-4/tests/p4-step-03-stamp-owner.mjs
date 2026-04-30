// Part 4 Step 3: Document Service middleware stamps owner on create.

import { assert, header, gql, register, authHeader, fileContains } from "./_lib.mjs";

header("Part 4 Step 3: stamp owner on create");

assert(fileContains("src/index.ts", "strapi.documents.use"), "src/index.ts registers a Document Service middleware");
assert(fileContains("src/index.ts", "context.uid !== \"api::note.note\""), "middleware short-circuits for non-Note uids");
assert(fileContains("src/index.ts", "context.action !== \"create\""), "middleware short-circuits for non-create actions");

// Two users; each creates a note; each note's owner should be the right user.
const a = await register("step3a");
const b = await register("step3b");

// Note: selecting `owner { ... }` on createNote response requires `find` permission
// on User, which the post (lines 547-580) explicitly says NOT to grant. Instead
// we verify ownership by reading via myNotes — the custom resolver Step 3 added
// for exactly this purpose.
const createA = await gql(
  `mutation { createNote(data: { title: "owned by A" }) { documentId } }`,
  {}, authHeader(a.jwt)
);
if (createA.json.errors) console.error(JSON.stringify(createA.json.errors));
const aDocId = createA.json.data?.createNote?.documentId;
assert(aDocId, "A created a note");

const createB = await gql(
  `mutation { createNote(data: { title: "owned by B" }) { documentId } }`,
  {}, authHeader(b.jwt)
);
const bDocId = createB.json.data?.createNote?.documentId;
assert(bDocId, "B created a note");

// Identity-claim attempt: user A passes B's id as owner. Middleware should override.
const claim = await gql(
  `mutation($d: NoteInput!){ createNote(data: $d) { documentId } }`,
  { d: { title: "A claims B's identity", owner: b.user.id } },
  authHeader(a.jwt)
);
if (claim.json.errors) console.error("claim errs:", JSON.stringify(claim.json.errors));
const claimDocId = claim.json.data?.createNote?.documentId;
assert(claimDocId, "claim-attempt note created");

// myNotes returns only A's notes when A is signed in.
// (myNotes is the resolver Step 3 added so we DON'T have to grant find on User.)
const myNotesA = await gql(
  `{ myNotes { user { id username } notes { documentId title } } }`,
  {}, authHeader(a.jwt)
);
if (myNotesA.json.errors) console.error("myNotes errs:", JSON.stringify(myNotesA.json.errors));
const aNotes = myNotesA.json.data?.myNotes?.notes ?? [];
assert(myNotesA.json.data?.myNotes?.user?.username === a.user.username, "myNotes.user.username matches signed-in user");
assert(aNotes.length === 2, `myNotes for A returns A's 2 notes including the claim-attempt (got ${aNotes.length})`);
const aDocIds = new Set(aNotes.map((n) => n.documentId));
assert(aDocIds.has(aDocId), "A's normally-created note is in A's myNotes");
assert(aDocIds.has(claimDocId), "A's claim-attempt note is in A's myNotes (middleware overrode A's bogus owner: B)");

const myNotesB = await gql(
  `{ myNotes { notes { documentId } } }`,
  {}, authHeader(b.jwt)
);
const bNotes = myNotesB.json.data?.myNotes?.notes ?? [];
assert(bNotes.length === 1, `myNotes for B returns the 1 note B created (got ${bNotes.length})`);
assert(bNotes[0].documentId === bDocId, "B's myNotes contains B's note (and not A's claim-attempt)");

// Anonymous myNotes is rejected (auth.scope api::note.note.find)
const anon = await gql(`{ myNotes { user { username } notes { documentId } } }`);
assert(anon.json.errors?.[0]?.extensions?.code === "FORBIDDEN", "anonymous myNotes rejected with FORBIDDEN");

console.log("\nP4 Step 3 OK");
