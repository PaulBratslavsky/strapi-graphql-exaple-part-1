// Part 4 Step 2: owner relation on Note.

import { assert, header, gql, register, authHeader, fileExists, readFile } from "./_lib.mjs";

header("Part 4 Step 2: owner relation");

const note = JSON.parse(readFile("src/api/note/content-types/note/schema.json"));
const o = note.attributes.owner;
assert(o, "Note schema has an owner attribute");
assert(o.relation === "manyToOne", "owner is manyToOne");
assert(o.target === "plugin::users-permissions.user", "owner targets the users-permissions User type");
assert(o.inversedBy === "notes", "owner inversedBy: notes");

assert(fileExists("src/extensions/users-permissions/content-types/user/schema.json"), "User schema is overridden in src/extensions/");
const user = JSON.parse(readFile("src/extensions/users-permissions/content-types/user/schema.json"));
assert(user.attributes.notes?.mappedBy === "owner", "User schema declares notes mappedBy: owner");

// Schema-level GraphQL: Note.owner field exists
const intro = await gql(`{ __type(name: "Note") { fields { name } } }`);
const fields = (intro.json.data?.__type?.fields ?? []).map((f) => f.name);
assert(fields.includes("owner"), "GraphQL Note type exposes owner");

// Behavior: a signed-in user can SEE owner via the Note query (we have not stamped ownership on
// existing seed notes, so they will report owner: null until backfill).
const u = await register("step2");
const list = await gql(`{ notes(pagination:{pageSize:1}) { documentId owner { documentId username } } }`, {}, authHeader(u.jwt));
const n0 = list.json.data?.notes?.[0];
assert(n0, "got at least one note");
assert(n0.owner === null, `existing seed notes have owner: null until Step 3 stamps it (got ${JSON.stringify(n0.owner)})`);

console.log("\nP4 Step 2 OK");
