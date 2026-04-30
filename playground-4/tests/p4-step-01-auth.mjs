// Part 4 Step 1: lock down public role, gate custom mutations + queries.

import { assert, header, gql, register, authHeader, fileContains } from "./_lib.mjs";

header("Part 4 Step 1: auth gating");

// File-level: resolversConfig changed
assert(fileContains("src/extensions/graphql/mutations.ts", '["api::note.note.update"]'), "togglePin/archiveNote use api::note.note.update scope");
assert(fileContains("src/extensions/graphql/mutations.ts", '["api::note.note.create"]'), "duplicateNote uses api::note.note.create scope");
assert(fileContains("src/extensions/graphql/queries.ts", '"Query.searchNotes": { auth: { scope: ["api::note.note.find"] } }'), "searchNotes scoped to note.find");

// Behavior: anonymous reads are forbidden
{
  const r = await gql(`{ notes { documentId } }`);
  const e = r.json.errors?.[0];
  assert(e?.extensions?.code === "FORBIDDEN", `anonymous notes query rejected with FORBIDDEN (got ${e?.extensions?.code})`);
}
{
  const r = await gql(`{ noteStats { total } }`);
  assert(r.json.errors?.[0]?.extensions?.code === "FORBIDDEN", "anonymous noteStats rejected with FORBIDDEN");
}

// Behavior: anonymous register works (auth.register on Public role)
const a = await register("a-step1");
assert(a.jwt, "register returns a JWT");
assert(a.user?.id, `register returns a user with id (${a.user?.id})`);

// Behavior: signed-in user can list notes (currently sees all of them — Step 6 fixes that)
const list = await gql(`{ notes { documentId title } }`, {}, authHeader(a.jwt));
assert(!list.json.errors, "signed-in `notes` query has no errors");
assert(list.json.data?.notes?.length > 0, `signed-in user sees notes (got ${list.json.data?.notes?.length}; ownership scoping happens in Step 6)`);

// Custom mutations: anonymous call to togglePin is rejected
{
  const r = await gql(`mutation($id: ID!){ togglePin(documentId: $id) { documentId } }`, { id: list.json.data.notes[0].documentId });
  assert(r.json.errors?.[0]?.extensions?.code === "FORBIDDEN", "anonymous togglePin rejected with FORBIDDEN");
}

// Public still has tag.find (post: tags are reference data)
{
  const r = await gql(`{ tags { slug } }`);
  assert(!r.json.errors, "anonymous tags query still works");
  assert(r.json.data?.tags?.length > 0, "anonymous tags returns >0 results");
}

console.log("\nP4 Step 1 OK");
