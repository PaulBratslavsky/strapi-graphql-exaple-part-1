// Part 4 Step 4: is-note-owner policy on the four write mutations.

import { assert, header, gql, register, authHeader, fileExists, fileContains } from "./_lib.mjs";

header("Part 4 Step 4: is-note-owner policy");

assert(fileExists("src/policies/is-note-owner.ts"), "src/policies/is-note-owner.ts exists");
for (const m of ["updateNote", "togglePin", "archiveNote", "duplicateNote"]) {
  assert(fileContains("src/extensions/graphql/middlewares-and-policies.ts",
    `"Mutation.${m}": { policies: ["global::is-note-owner"] }`),
    `Mutation.${m} has policies: [is-note-owner]`);
}

// Two users
const a = await register("step4a");
const b = await register("step4b");

// A creates a note
const create = await gql(
  `mutation { createNote(data: { title: "owned by A" }) { documentId } }`,
  {}, authHeader(a.jwt)
);
const noteId = create.json.data?.createNote?.documentId;
assert(noteId, "A created a note");

// B's call to togglePin on A's note → Policy Failed
const bToggle = await gql(
  `mutation($id: ID!){ togglePin(documentId: $id) { documentId } }`,
  { id: noteId }, authHeader(b.jwt)
);
const bErr = bToggle.json.errors?.[0];
assert(bErr, "B's togglePin attempt produced an error");
assert(/Policy Failed/i.test(bErr.message), `error is Policy Failed (got "${bErr.message}")`);

// B's call to archiveNote on A's note → Policy Failed
const bArchive = await gql(
  `mutation($id: ID!){ archiveNote(documentId: $id) { documentId } }`,
  { id: noteId }, authHeader(b.jwt)
);
assert(/Policy Failed/i.test(bArchive.json.errors?.[0]?.message ?? ""), "B's archiveNote attempt rejected as Policy Failed");

// B's call to duplicateNote on A's note → Policy Failed
const bDup = await gql(
  `mutation($id: ID!){ duplicateNote(documentId: $id) { documentId } }`,
  { id: noteId }, authHeader(b.jwt)
);
assert(/Policy Failed/i.test(bDup.json.errors?.[0]?.message ?? ""), "B's duplicateNote attempt rejected as Policy Failed");

// B's call to updateNote on A's note → Policy Failed
const bUpdate = await gql(
  `mutation($id: ID!, $d: NoteInput!){ updateNote(documentId: $id, data: $d) { documentId } }`,
  { id: noteId, d: { title: "B-pwned" } }, authHeader(b.jwt)
);
assert(/Policy Failed/i.test(bUpdate.json.errors?.[0]?.message ?? ""), "B's updateNote attempt rejected as Policy Failed");

// A's call to togglePin on A's own note → succeeds
const aToggle = await gql(
  `mutation($id: ID!){ togglePin(documentId: $id) { pinned } }`,
  { id: noteId }, authHeader(a.jwt)
);
assert(aToggle.json.data?.togglePin?.pinned === true, "A can pin A's note (false → true)");

console.log("\nP4 Step 4 OK");
