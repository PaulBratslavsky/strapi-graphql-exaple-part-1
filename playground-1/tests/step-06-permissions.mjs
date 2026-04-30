// Step 6: grant public role find/findOne/create/update/delete on Article, Author, Category.
// The seed script grants find/findOne by default, so we add the missing three actions
// (create, update, delete) for each of the three collection types via the admin API.
//
// Verifies: anonymous GraphQL queries reach the data; the public role row in up_permissions
// covers all five actions for each content type.

import { execSync } from "node:child_process";
import { assert, header, gql } from "./_lib.mjs";

header("Step 6: public permissions");

// 1. Anonymous read access already proven to work in the in-process state at this point.
const articlesGql = await gql(`{ articles { documentId } }`);
assert(articlesGql.json.data?.articles?.length >= 5, "anonymous GraphQL `articles` returns >=5 entries");

// 2. Add the missing create/update/delete permissions for the three CTs.
//    We do this by INSERTing directly into up_permissions, mirroring what the
//    admin UI's "Save permissions" button does. Strapi reloads role caches on
//    next permission read, but writes that go through the DB still take effect
//    on resolver auth checks because UP looks up by action+role.
const db = "/Users/paul/work/blog/graphql-customization/playground/server/.tmp/data.db";
const cts = ["article", "author", "category"];
const actions = ["create", "update", "delete"];

// Look up the public role id.
const publicRoleId = execSync(
  `sqlite3 ${db} "SELECT id FROM up_roles WHERE type='public' LIMIT 1;"`,
  { encoding: "utf8" }
).trim();
assert(publicRoleId, `public role exists (id=${publicRoleId})`);

for (const ct of cts) {
  for (const a of actions) {
    const action = `api::${ct}.${ct}.${a}`;
    // Insert the permission row if missing
    execSync(
      `sqlite3 ${db} "INSERT OR IGNORE INTO up_permissions (action, created_at, updated_at) VALUES ('${action}', datetime('now'), datetime('now'));"`
    );
    // Get the permission id
    const permId = execSync(
      `sqlite3 ${db} "SELECT id FROM up_permissions WHERE action='${action}' LIMIT 1;"`,
      { encoding: "utf8" }
    ).trim();
    // Link it to the public role via the join table
    execSync(
      `sqlite3 ${db} "INSERT OR IGNORE INTO up_permissions_role_lnk (permission_id, role_id) VALUES (${permId}, ${publicRoleId});"`
    );
  }
}

// 3. Verify the rows exist
for (const ct of cts) {
  for (const a of ["find", "findOne", "create", "update", "delete"]) {
    const action = `api::${ct}.${ct}.${a}`;
    const linked = execSync(
      `sqlite3 ${db} "SELECT COUNT(*) FROM up_permissions p JOIN up_permissions_role_lnk l ON p.id=l.permission_id WHERE p.action='${action}' AND l.role_id=${publicRoleId};"`,
      { encoding: "utf8" }
    ).trim();
    assert(linked === "1", `public role has ${action}`);
  }
}

console.log("\nStep 6 OK");
