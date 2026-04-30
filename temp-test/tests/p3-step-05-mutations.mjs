// Part 3 Step 5: Server Action mutations.
// We can't easily invoke a Server Action from outside the Next.js runtime, but
// we *can* verify each path:
//   1. The mutation documents are present in lib/graphql.ts.
//   2. The action files import the right things and call the right mutation.
//   3. The underlying GraphQL mutations actually work end-to-end (verified by
//      directly calling the Strapi GraphQL API the way the actions do).

import { assert, header, fileContains, gql } from "./_lib.mjs";

header("Part 3 Step 5: Server Action mutations");

// 1. mutation documents
for (const m of ["TAGS", "CREATE_NOTE", "UPDATE_NOTE", "TOGGLE_PIN", "ARCHIVE_NOTE"]) {
  assert(fileContains("lib/graphql.ts", m), `lib/graphql.ts exports ${m}`);
}

// 2. action files
assert(fileContains("app/notes/new/actions.ts", "createNote"), "createNoteAction calls createNote");
assert(fileContains("app/notes/new/actions.ts", "revalidatePath"), "createNoteAction revalidates the home page");
assert(fileContains("app/notes/new/actions.ts", "redirect"), "createNoteAction redirects to the new note");

assert(fileContains("app/notes/[documentId]/edit/actions.ts", "UPDATE_NOTE"), "updateNoteAction uses UPDATE_NOTE");
assert(fileContains("app/notes/[documentId]/edit/actions.ts", "revalidatePath(\"/\")"), "updateNoteAction revalidates the home page");

assert(fileContains("app/notes/[documentId]/actions.ts", "TOGGLE_PIN"), "togglePinAction uses TOGGLE_PIN");
assert(fileContains("app/notes/[documentId]/actions.ts", "ARCHIVE_NOTE"), "archiveNoteAction uses ARCHIVE_NOTE");
assert(fileContains("app/notes/[documentId]/actions.ts", 'redirect("/")'), "archiveNoteAction redirects home");

// 3. exercise the same mutations end-to-end against Strapi
// createNote
const create = await gql(
  `mutation($d:NoteInput!){ createNote(data:$d){ documentId title } }`,
  { d: { title: `P3 Step5 test ${Date.now()}`, content: "", pinned: false, archived: false, tags: [] } }
);
const newId = create.json.data?.createNote?.documentId;
assert(newId, "createNote works end-to-end");

// togglePin
const tog = await gql(
  `mutation($id: ID!){ togglePin(documentId: $id){ pinned } }`,
  { id: newId }
);
assert(tog.json.data?.togglePin?.pinned === true, "togglePin flips false → true");

// updateNote
const upd = await gql(
  `mutation($id: ID!, $d: NoteInput!){ updateNote(documentId: $id, data: $d){ documentId title } }`,
  { id: newId, data: undefined, d: { title: "renamed by step5 test" } }
);
assert(upd.json.data?.updateNote?.title === "renamed by step5 test", "updateNote changes the title");

// archiveNote
const arch = await gql(
  `mutation($id: ID!){ archiveNote(documentId: $id){ archived pinned } }`,
  { id: newId }
);
assert(arch.json.data?.archiveNote?.archived === true, "archiveNote sets archived=true");
assert(arch.json.data?.archiveNote?.pinned === false, "archiveNote also sets pinned=false");

// 4. /notes/new and /notes/<id>/edit pages should still render (now using real data)
import { fetchPage } from "./_lib.mjs";
const newPage = await fetchPage("/notes/new");
assert(newPage.status === 200, "GET /notes/new returns 200");
// Tag names from the seed should appear in the rendered form
for (const tagName of ["Ideas", "Work", "Personal", "Bugs", "Drafts"]) {
  assert(newPage.text.includes(tagName), `/notes/new renders tag "${tagName}"`);
}

// Get an existing active note to test the edit page
const existing = await gql(`{ notes(pagination:{pageSize:1}) { documentId title content } }`);
const eNote = existing.json.data?.notes?.[0];
const editPage = await fetchPage(`/notes/${eNote.documentId}/edit`);
assert(editPage.status === 200, "GET /notes/<id>/edit returns 200");
assert(editPage.text.includes(eNote.title), "edit page prefills the title");

console.log("\nP3 Step 5 OK");
