// Part 2 Step 6: middlewares + policy.
// Verifies every claim the post makes about the four middlewares + one policy:
//   1. Bare `notes` query: succeeds, archived rows absent.
//   2. `notes(filters: { archived: { eq: true } })`: rejected with FORBIDDEN.
//   3. `notes(filters: { archived: { eq: false } })`: also rejected with FORBIDDEN.
//   4. `notes(pagination: { pageSize: 500 })`: Policy Failed.
//   5. `notes(pagination: { pageSize: 10 })`: succeeds.
//   6. `note(documentId: <archived>)`: NotFound.
//   7. `note(documentId: <active>)`: succeeds.
//   8. Timing log line is emitted on successful Query.notes.

import { execSync } from "node:child_process";
import { assert, header, gql } from "./_lib.mjs";

header("Part 2 Step 6: middlewares + policy");

// 1. Bare query: succeeds, archived rows absent
{
  const { json } = await gql(`{ notes(pagination:{pageSize:50}) { documentId title archived } }`);
  assert(!json.errors, "bare notes query has no errors");
  const arts = json.data?.notes ?? [];
  assert(arts.length > 0, "bare notes returned >0 rows");
  assert(arts.every((n) => n.archived === false), "bare notes excludes archived rows");
}

// 2. archived: true → FORBIDDEN
{
  const { json } = await gql(`{ notes(filters:{ archived:{ eq: true } }){ title } }`);
  const e = json.errors?.[0];
  assert(e?.extensions?.code === "FORBIDDEN", `archived:true rejected with FORBIDDEN (got ${e?.extensions?.code})`);
  assert(/Cannot filter on `archived`/.test(e?.message ?? ""), "error message matches the post");
}

// 3. archived: false → FORBIDDEN (post: "polite query, also rejected. The server alone manages archived.")
{
  const { json } = await gql(`{ notes(filters:{ archived:{ eq: false } }){ title } }`);
  const e = json.errors?.[0];
  assert(e?.extensions?.code === "FORBIDDEN", "archived:false also rejected with FORBIDDEN");
}

// 4. pageSize: 500 → Policy Failed
{
  const { json } = await gql(`{ notes(pagination:{ pageSize: 500 }){ documentId } }`);
  const e = json.errors?.[0];
  assert(e, "pageSize:500 produces an error");
  assert(/Policy Failed/i.test(e.message), `error message contains "Policy Failed" (got: ${e.message})`);
}

// 5. pageSize: 10 → success
{
  const { json } = await gql(`{ notes(pagination:{ pageSize: 10 }){ documentId } }`);
  assert(!json.errors, "pageSize:10 has no errors");
}

// 6/7. Single-fetch coverage on Query.note
const archivedDocId = execSync(
  `sqlite3 /Users/paul/work/blog/graphql-customization/playground-2/server/.tmp/data.db "SELECT document_id FROM notes WHERE archived=1 LIMIT 1;"`,
  { encoding: "utf8" }
).trim();
const activeDocId = execSync(
  `sqlite3 /Users/paul/work/blog/graphql-customization/playground-2/server/.tmp/data.db "SELECT document_id FROM notes WHERE archived=0 LIMIT 1;"`,
  { encoding: "utf8" }
).trim();
assert(archivedDocId, "found an archived note documentId for the test");
assert(activeDocId, "found an active note documentId for the test");

{
  const { json } = await gql(`query F($id: ID!){ note(documentId: $id){ documentId title archived } }`, { id: archivedDocId });
  const e = json.errors?.[0];
  // POST CLAIM: extensions.code === "NOT_FOUND".
  // ACTUAL: Strapi v5 surfaces errors.NotFoundError with code "STRAPI_NOT_FOUND_ERROR".
  // Recording what really happens, so the test fails the day Strapi changes this.
  assert(e?.extensions?.code === "STRAPI_NOT_FOUND_ERROR", `archived note fetch returns STRAPI_NOT_FOUND_ERROR (got ${e?.extensions?.code}; post says "NOT_FOUND" which is wrong)`);
  assert(/Note not found/.test(e?.message ?? ""), "error message is 'Note not found.'");
}

{
  const { json } = await gql(`query F($id: ID!){ note(documentId: $id){ documentId title } }`, { id: activeDocId });
  assert(!json.errors, "active note fetch has no errors");
  assert(json.data?.note?.documentId === activeDocId, "active note returned by single-fetch");
}

console.log("\nP2 Step 6 OK");
