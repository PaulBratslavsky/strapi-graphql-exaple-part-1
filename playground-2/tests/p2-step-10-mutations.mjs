// Part 2 Step 10: custom mutations togglePin, archiveNote, duplicateNote.
// Each is meant to return the affected note with `tags` populated.

import { execSync } from "node:child_process";
import { assert, header, gql } from "./_lib.mjs";

header("Part 2 Step 10: custom mutations");

// Pick a fresh, non-archived, unpinned note that we can mutate without disturbing
// the rest of the seed.
const create = await gql(`mutation($d:NoteInput!){ createNote(data:$d){ documentId pinned archived tags { documentId slug } } }`, {
  d: { title: `Mutation test ${Date.now()}`, content: "Hello world.", pinned: false, archived: false, tags: [] },
});
const noteId = create.json.data?.createNote?.documentId;
assert(noteId, `created a fresh note for testing (id=${noteId})`);

// 1. togglePin: flips boolean and returns Note with tags populated
{
  const r1 = await gql(`mutation($id: ID!){ togglePin(documentId: $id){ documentId pinned tags { slug } } }`, { id: noteId });
  if (r1.json.errors) console.error(JSON.stringify(r1.json.errors));
  assert(r1.json.data?.togglePin?.pinned === true, "togglePin: false → true");
  assert(Array.isArray(r1.json.data?.togglePin?.tags), "togglePin returns populated tags array");

  const r2 = await gql(`mutation($id: ID!){ togglePin(documentId: $id){ pinned } }`, { id: noteId });
  assert(r2.json.data?.togglePin?.pinned === false, "togglePin: true → false");
}

// 2. archiveNote: sets archived=true AND pinned=false
{
  // First pin it so we can verify archive un-pins
  await gql(`mutation($id: ID!){ togglePin(documentId: $id){ pinned } }`, { id: noteId });
  const r = await gql(`mutation($id: ID!){ archiveNote(documentId: $id){ documentId archived pinned tags { slug } } }`, { id: noteId });
  if (r.json.errors) console.error(JSON.stringify(r.json.errors));
  const a = r.json.data?.archiveNote;
  assert(a?.archived === true, "archiveNote sets archived=true");
  assert(a?.pinned === false, "archiveNote also sets pinned=false (the post: 'data: { archived: true, pinned: false }')");
  assert(Array.isArray(a?.tags), "archiveNote returns populated tags array");
}

// 3. duplicateNote: produces a new documentId, copies title with "(copy)" suffix,
//    copies content, copies tags, sets pinned=false, archived=false.
{
  // Make a tagged source note for a fair test of tag copying. Use the existing
  // "Gift ideas" note from the seed (has personal + ideas tags).
  const src = await gql(`{ notes(filters:{ title: { eq: "Gift ideas" } }, pagination: { pageSize: 1 }) { documentId title content tags { documentId slug } } }`);
  const srcNote = src.json.data?.notes?.[0];
  assert(srcNote, "found 'Gift ideas' note as the duplicate source");
  assert(srcNote.tags.length === 2, `source has 2 tags (got ${srcNote.tags.length})`);

  const r = await gql(`mutation($id: ID!){ duplicateNote(documentId: $id){ documentId title content pinned archived tags { documentId slug } } }`, { id: srcNote.documentId });
  if (r.json.errors) console.error(JSON.stringify(r.json.errors));
  const dup = r.json.data?.duplicateNote;
  assert(dup, "duplicateNote returned a note");
  assert(dup.documentId !== srcNote.documentId, "duplicate has a different documentId");
  assert(dup.title === `${srcNote.title} (copy)`, `title has "(copy)" suffix (got "${dup.title}")`);
  assert(dup.content === srcNote.content, "content copied verbatim");
  assert(dup.pinned === false, "duplicate is not pinned");
  assert(dup.archived === false, "duplicate is not archived");
  assert(dup.tags.length === srcNote.tags.length, `duplicate has same tag count (got ${dup.tags.length}, expected ${srcNote.tags.length})`);
  const srcSlugs = srcNote.tags.map((t) => t.slug).sort();
  const dupSlugs = dup.tags.map((t) => t.slug).sort();
  assert(JSON.stringify(srcSlugs) === JSON.stringify(dupSlugs), `tag slugs match (src=${srcSlugs}, dup=${dupSlugs})`);

  // Cleanup: hard-delete the duplicate via admin API (public role does NOT have note.delete per the post).
  const login = await fetch("http://localhost:1337/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@test.local", password: "Testing123!" }),
  });
  const token = (await login.json()).data.token;
  await fetch(
    `http://localhost:1337/content-manager/collection-types/api::note.note/${dup.documentId}`,
    { method: "DELETE", headers: { authorization: `Bearer ${token}` } }
  );
}

// Final cleanup: delete the test note via admin API.
const login = await fetch("http://localhost:1337/admin/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@test.local", password: "Testing123!" }),
});
const token = (await login.json()).data.token;
await fetch(
  `http://localhost:1337/content-manager/collection-types/api::note.note/${noteId}`,
  { method: "DELETE", headers: { authorization: `Bearer ${token}` } }
);

console.log("\nP2 Step 10 OK");
