// Part 2 Step 3: public permissions for Note (find, findOne, create, update — NOT delete)
// and Tag (all five). The post is explicit: Note.delete is left UNCHECKED so the
// public API cannot hard-delete a note (soft-delete only via the `archived` flag).

import { execSync } from "node:child_process";
import { assert, header, gql } from "./_lib.mjs";

header("Part 2 Step 3: public permissions for Note + Tag");

const db = "/Users/paul/work/blog/graphql-customization/playground-2/server/.tmp/data.db";
const publicRoleId = execSync(
  `sqlite3 ${db} "SELECT id FROM up_roles WHERE type='public' LIMIT 1;"`,
  { encoding: "utf8" }
).trim();
assert(publicRoleId, `public role exists (id=${publicRoleId})`);

// Note: find, findOne, create, update — NOT delete
const noteActions = ["find", "findOne", "create", "update"];
for (const a of noteActions) {
  const action = `api::note.note.${a}`;
  execSync(`sqlite3 ${db} "INSERT OR IGNORE INTO up_permissions (action, created_at, updated_at) VALUES ('${action}', datetime('now'), datetime('now'));"`);
  const pid = execSync(`sqlite3 ${db} "SELECT id FROM up_permissions WHERE action='${action}' LIMIT 1;"`, { encoding: "utf8" }).trim();
  execSync(`sqlite3 ${db} "INSERT OR IGNORE INTO up_permissions_role_lnk (permission_id, role_id) VALUES (${pid}, ${publicRoleId});"`);
}

// Tag: all five
for (const a of ["find", "findOne", "create", "update", "delete"]) {
  const action = `api::tag.tag.${a}`;
  execSync(`sqlite3 ${db} "INSERT OR IGNORE INTO up_permissions (action, created_at, updated_at) VALUES ('${action}', datetime('now'), datetime('now'));"`);
  const pid = execSync(`sqlite3 ${db} "SELECT id FROM up_permissions WHERE action='${action}' LIMIT 1;"`, { encoding: "utf8" }).trim();
  execSync(`sqlite3 ${db} "INSERT OR IGNORE INTO up_permissions_role_lnk (permission_id, role_id) VALUES (${pid}, ${publicRoleId});"`);
}

// Verify Note permissions
for (const a of noteActions) {
  const linked = execSync(`sqlite3 ${db} "SELECT COUNT(*) FROM up_permissions p JOIN up_permissions_role_lnk l ON p.id=l.permission_id WHERE p.action='api::note.note.${a}' AND l.role_id=${publicRoleId};"`, { encoding: "utf8" }).trim();
  assert(linked === "1", `public role has note.${a}`);
}
// Note delete must NOT be linked
const deleteLinked = execSync(`sqlite3 ${db} "SELECT COUNT(*) FROM up_permissions p JOIN up_permissions_role_lnk l ON p.id=l.permission_id WHERE p.action='api::note.note.delete' AND l.role_id=${publicRoleId};"`, { encoding: "utf8" }).trim();
assert(deleteLinked === "0", `public role does NOT have note.delete (post says leave unchecked)`);

// Verify Tag permissions
for (const a of ["find", "findOne", "create", "update", "delete"]) {
  const linked = execSync(`sqlite3 ${db} "SELECT COUNT(*) FROM up_permissions p JOIN up_permissions_role_lnk l ON p.id=l.permission_id WHERE p.action='api::tag.tag.${a}' AND l.role_id=${publicRoleId};"`, { encoding: "utf8" }).trim();
  assert(linked === "1", `public role has tag.${a}`);
}

console.log("\nP2 Step 3 OK");
