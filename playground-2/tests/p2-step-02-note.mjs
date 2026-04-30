// Part 2 Step 2: Note content type, including the post's `private: true` claim.
// The post (lines 198-224) makes specific introspection claims for `internalNotes`:
//   - absent from output type Note
//   - absent from filter input type NoteFiltersInput
//   - absent from mutation input type NoteInput

import { assert, header, gql, fileExists, readJSON } from "./_lib.mjs";

header("Part 2 Step 2: Note content type + private internalNotes");

// 1. Schema file matches the post
assert(fileExists("src/api/note/content-types/note/schema.json"), "note schema.json exists");
const note = readJSON("src/api/note/content-types/note/schema.json");
assert(note.options?.draftAndPublish === false, "Note has draftAndPublish: false");

const a = note.attributes;
assert(a.title?.type === "string" && a.title?.required === true, "title is required string");
assert(a.content?.type === "richtext", "content is richtext (markdown variant)");
assert(a.pinned?.type === "boolean" && a.pinned?.default === false, "pinned is boolean default false");
assert(a.archived?.type === "boolean" && a.archived?.default === false, "archived is boolean default false");
assert(a.internalNotes?.type === "text" && a.internalNotes?.private === true, "internalNotes is private long text");
assert(a.tags?.type === "relation" && a.tags?.relation === "manyToMany" && a.tags?.target === "api::tag.tag", "tags is m2m to Tag");

// 2. The post's PrivateReference query: internalNotes absent from all three.
const { json } = await gql(`{
  note: __type(name: "Note") { fields { name } }
  filter: __type(name: "NoteFiltersInput") { inputFields { name } }
  input: __type(name: "NoteInput") { inputFields { name } }
}`);

const noteFieldNames = (json.data?.note?.fields ?? []).map((f) => f.name);
const filterFieldNames = (json.data?.filter?.inputFields ?? []).map((f) => f.name);
const inputFieldNames = (json.data?.input?.inputFields ?? []).map((f) => f.name);

assert(noteFieldNames.length > 0, "Note output type exists in schema");
assert(filterFieldNames.length > 0, "NoteFiltersInput exists in schema");
assert(inputFieldNames.length > 0, "NoteInput exists in schema");

assert(!noteFieldNames.includes("internalNotes"), "internalNotes is NOT in Note output type");
assert(!filterFieldNames.includes("internalNotes"), "internalNotes is NOT in NoteFiltersInput");
assert(!inputFieldNames.includes("internalNotes"), "internalNotes is NOT in NoteInput");

// 3. Sanity: the public fields ARE present
for (const f of ["title", "content", "pinned", "archived", "tags"]) {
  assert(noteFieldNames.includes(f), `Note.${f} IS in output type`);
}
for (const f of ["title", "pinned", "archived"]) {
  assert(filterFieldNames.includes(f), `NoteFiltersInput.${f} IS present`);
}
for (const f of ["title", "content", "pinned", "archived", "tags"]) {
  assert(inputFieldNames.includes(f), `NoteInput.${f} IS present`);
}

console.log("\nP2 Step 2 OK");
