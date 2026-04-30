// Part 4 Step 7: the post says appending the ownership block to test-graphql.mjs
// gives "Two new green lines should appear" when running npm run test:backend.
//
// Reality: the existing 33 checks fail before the ownership block runs, because
// Part 4 Step 1.2 disabled anonymous reads on Note. The script's section 1 calls
// `notes` anonymously and bails. So `npm run test:backend` doesn't actually
// produce "two new green lines"; it produces a hard failure at section 1.
//
// We exercise the *content* of the ownership block here directly to confirm the
// behavior the post wants to assert.

import { assert, header, gql, register, authHeader } from "./_lib.mjs";

header("Part 4 Step 7: ownership two-user isolation (post's contract test, run in isolation)");

const a = await register("step7a");
const b = await register("step7b");

// A creates a note
const create = await gql(
  `mutation { createNote(data: { title: "testuser-only", content: "secret" }) { documentId } }`,
  {}, authHeader(a.jwt)
);
const aNote = create.json.data?.createNote;
assert(aNote?.documentId, "A created a note");

// B's `notes` list does not include A's note
const bView = await gql(`{ notes { documentId } }`, {}, authHeader(b.jwt));
const bIds = (bView.json.data?.notes ?? []).map((n) => n.documentId);
assert(!bIds.includes(aNote.documentId), "testuser2 does not see testuser's notes in the list");

// B cannot toggle pin on A's note
const attack = await gql(
  `mutation A($id: ID!) { togglePin(documentId: $id) { documentId } }`,
  { id: aNote.documentId }, authHeader(b.jwt)
);
const e = attack.json.errors?.[0];
assert(e && /Policy Failed|Forbidden/i.test(e.message),
  `testuser2 cannot toggle pin on testuser's note (got: ${e?.message ?? "no error"})`);

// Run the post's bundled npm run test:backend and check it FAILS at section 1
// (the post's claim "two new green lines should appear" is wrong because anonymous
//  reads are now blocked).
import { execSync } from "node:child_process";
let bundledStdout = "";
let bundledExit = 0;
try {
  bundledStdout = execSync(
    "cd /Users/paul/work/blog/graphql-customization/playground-4/client && node scripts/test-graphql.mjs 2>&1",
    { encoding: "utf8" }
  );
} catch (err) {
  bundledStdout = err.stdout?.toString() ?? "";
  bundledExit = err.status ?? 1;
}
assert(bundledExit !== 0, "bundled npm run test:backend exits non-zero after Part 4 Step 1");
assert(/No active notes in the database/.test(bundledStdout),
  "bundled test bails at 'No active notes in the database' because anonymous reads are blocked");

console.log("\nP4 Step 7 OK (with finding: bundled test is broken after Step 1.2)");
