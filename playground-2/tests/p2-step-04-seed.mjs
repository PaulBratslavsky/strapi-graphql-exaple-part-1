// Part 2 Step 4: seed Tag + Note entries.
// Post seeds 3 tags (Work blue, Personal green, Ideas yellow) and 3 notes
// (one pinned, none archived, internalNotes filled). We add a few more to
// give later steps real data: 6 notes total, mix of pinned/archived states,
// some with multiple tags.

import { assert, header, gql } from "./_lib.mjs";

header("Part 2 Step 4: seed Tag + Note");

// Tags
const tags = [
  { name: "Work", slug: "work", color: "blue" },
  { name: "Personal", slug: "personal", color: "green" },
  { name: "Ideas", slug: "ideas", color: "yellow" },
];
const tagIds = {};
for (const t of tags) {
  // Check if already exists
  const existing = await gql(`query($s:String!){ tags(filters:{slug:{eq:$s}}){ documentId name } }`, { s: t.slug });
  if (existing.json.data?.tags?.length) {
    tagIds[t.slug] = existing.json.data.tags[0].documentId;
    continue;
  }
  const r = await gql(`mutation($d: TagInput!){ createTag(data:$d){ documentId slug } }`, { d: t });
  if (r.json.errors) {
    console.error("create tag error", JSON.stringify(r.json.errors));
  }
  tagIds[t.slug] = r.json.data.createTag.documentId;
}
assert(Object.keys(tagIds).length === 3, "all 3 tags exist");

// Notes. The post seeds via the admin UI; we seed via the public GraphQL API for
// the public fields, then fill `internalNotes` via the admin Content Manager API
// (since the public GraphQL NoteInput excludes internalNotes per Step 2's privacy
// guarantee).
const notes = [
  { title: "Weekly review", content: "What I shipped this week and what is on deck for next week.", pinned: true, archived: false, tags: [tagIds.work], internalNotes: "moderator: low priority" },
  { title: "Gift ideas", content: "List of gift ideas for upcoming birthdays.", pinned: false, archived: false, tags: [tagIds.personal, tagIds.ideas], internalNotes: "moderator: low priority" },
  { title: "Side project backlog", content: "Things I want to build when I have a free weekend.", pinned: false, archived: false, tags: [tagIds.ideas], internalNotes: "" },
  { title: "Old archived note", content: "A note that has been archived.", pinned: false, archived: true, tags: [tagIds.work], internalNotes: "" },
  { title: "Pinned about internet", content: "Random pinned note about the internet.", pinned: true, archived: false, tags: [], internalNotes: "" },
  { title: "Untagged misc", content: "A note with no tags.", pinned: false, archived: false, tags: [], internalNotes: "" },
];

// Login as admin once for any internalNotes patches.
const login = await fetch("http://localhost:1337/admin/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@test.local", password: "Testing123!" }),
});
const token = (await login.json()).data.token;

for (const n of notes) {
  const ex = await gql(`query($t:String!){ notes(filters:{title:{eq:$t}}){ documentId } }`, { t: n.title });
  let docId = ex.json.data?.notes?.[0]?.documentId;
  if (!docId) {
    const { internalNotes, ...publicData } = n;
    const r = await gql(`mutation($d: NoteInput!){ createNote(data:$d){ documentId title } }`, { d: publicData });
    if (r.json.errors) {
      console.error("create note error", JSON.stringify(r.json.errors[0].message));
      continue;
    }
    docId = r.json.data.createNote.documentId;
  }
  // Patch internalNotes via admin Content Manager API (it can see private fields).
  if (n.internalNotes) {
    await fetch(
      `http://localhost:1337/content-manager/collection-types/api::note.note/${docId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ internalNotes: n.internalNotes }),
      }
    );
  }
}

// Verify via the admin Content Manager API rather than the public `notes` query.
// Once Step 6's soft-delete middleware is registered, the public query hides
// archived notes, so we cannot use it to assert "at least one archived note exists".
const adminList = await fetch(
  "http://localhost:1337/content-manager/collection-types/api::note.note?pageSize=100",
  { headers: { authorization: `Bearer ${token}` } }
);
const adminJson = await adminList.json();
const list = (adminJson.results ?? []).map((n) => ({
  documentId: n.documentId,
  title: n.title,
  pinned: n.pinned,
  archived: n.archived,
  tags: Array.isArray(n.tags) ? n.tags : [],
}));
assert(list.length >= 6, `>=6 notes total (got ${list.length})`);
assert(list.some((n) => n.pinned), "at least one pinned note");
assert(list.some((n) => !n.pinned), "at least one not-pinned note");
assert(list.some((n) => n.archived), "at least one archived note (used by Step 6 soft-delete tests)");
assert(list.some((n) => !n.archived), "at least one non-archived note");
assert(list.some((n) => n.tags.length >= 2), "at least one note has multiple tags");
assert(list.some((n) => n.tags.length === 0), "at least one note has no tags");

console.log("\nP2 Step 4 OK");
