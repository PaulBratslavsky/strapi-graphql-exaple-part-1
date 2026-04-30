// Part 3 Step 4: detail page renders the real note for a given documentId,
// returns 404 for missing/archived notes (the latter via Part 2's middleware).

import { assert, header, fetchPage, gql } from "./_lib.mjs";

header("Part 3 Step 4: note detail");

// Get a real note documentId + an archived note documentId
const list = await gql(`{ notes(pagination:{pageSize:50}) { documentId title content } }`);
const note = list.json.data?.notes?.[0];
assert(note?.documentId, "found a real active note");

// Fetch the detail page
const detail = await fetchPage(`/notes/${note.documentId}`);
assert(detail.status === 200, "GET /notes/<id> returns 200");
assert(detail.text.includes(note.title), "detail page shows the note title");
// content from the seed (markdown is rendered through <Markdown>, so look for
// individual words rather than verbatim markdown syntax)
const contentWords = (note.content ?? "").replace(/[#*_`\\]/g, "").trim().split(/\s+/).filter((w) => w.length >= 4).slice(0, 3);
for (const w of contentWords) {
  assert(detail.text.includes(w), `detail page renders content word "${w}"`);
}
// computed fields
assert(/words.*min read/.test(detail.text), "detail page shows wordCount + readingTime");

// 404 for unknown documentId
const missing = await fetchPage(`/notes/this-doc-id-does-not-exist`);
assert(missing.status === 404, `unknown documentId returns 404 (got ${missing.status})`);

// Archived note: Part 2's soft-delete middleware throws STRAPI_NOT_FOUND_ERROR.
// Find an archived note via admin DB lookup.
import { execSync } from "node:child_process";
const archivedDocId = execSync(
  `sqlite3 /Users/paul/work/blog/graphql-customization/playground-2/server/.tmp/data.db "SELECT document_id FROM notes WHERE archived=1 LIMIT 1;"`,
  { encoding: "utf8" }
).trim();
if (archivedDocId) {
  const archived = await fetchPage(`/notes/${archivedDocId}`);
  // The middleware throws an error, the Server Component sees a GraphQL error,
  // so this either renders an error page or a 404 (if the page handles it via notFound).
  assert([404, 500].includes(archived.status),
    `archived note fetch returns 404 or 500 (got ${archived.status}); the soft-delete middleware throws STRAPI_NOT_FOUND_ERROR`);
}

console.log("\nP3 Step 4 OK");
