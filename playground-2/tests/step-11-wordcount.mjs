// Step 11: Article.wordCount computed field.

import { assert, header, gql } from "./_lib.mjs";

header("Step 11: wordCount computed field");

// Schema must now expose wordCount on Article.
const introResult = await gql(`{
  __type(name: "Article") { fields { name type { kind name ofType { name kind } } } }
}`);
const fields = introResult.json.data?.__type?.fields ?? [];
const wordCountField = fields.find((f) => f.name === "wordCount");
assert(wordCountField, "Article type exposes a wordCount field");
const ofType = wordCountField.type.ofType ?? wordCountField.type;
assert(ofType?.name === "Int", `wordCount is an Int (got ${ofType?.name})`);
assert(wordCountField.type.kind === "NON_NULL", "wordCount is NON_NULL (Int!)");

// Behavior: each Article's wordCount equals the description split on whitespace.
const { json } = await gql(`{ articles(pagination:{ pageSize: 25 }) { description wordCount } }`);
const arts = json.data?.articles ?? [];
assert(arts.length > 0, "got articles back");
let mismatches = 0;
for (const a of arts) {
  const expected = (a.description ?? "").trim()
    ? (a.description ?? "").trim().split(/\s+/).length
    : 0;
  if (a.wordCount !== expected) {
    mismatches++;
    console.error(`  mismatch: wordCount=${a.wordCount}, expected=${expected}, desc=${JSON.stringify(a.description)}`);
  }
}
assert(mismatches === 0, `every article's wordCount matches whitespace-split length`);

// Auth bypass: post claims `auth: false` lets unauthenticated callers select wordCount.
// We've been calling unauthenticated this whole test, so the previous pass already proves this,
// but let's add an explicit assertion that no auth header is required.
const noAuth = await fetch("http://localhost:1337/graphql", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ query: `{ articles { wordCount } }` }),
});
const noAuthJson = await noAuth.json();
assert(!noAuthJson.errors, "unauthenticated query for wordCount has no errors");

console.log("\nStep 11 OK");
