// Step 12: Query.searchArticles custom query.

import { assert, header, gql } from "./_lib.mjs";

header("Step 12: searchArticles custom query");

// Schema check: top-level Query has searchArticles(q: String!): [Article!]
const schemaIntro = await gql(`{
  __type(name: "Query") {
    fields {
      name
      args { name type { kind ofType { name } } }
      type { kind ofType { kind ofType { name } name } }
    }
  }
}`);
const fields = schemaIntro.json.data?.__type?.fields ?? [];
const sa = fields.find((f) => f.name === "searchArticles");
assert(sa, "Query.searchArticles exists in schema");
const qArg = sa.args.find((a) => a.name === "q");
assert(qArg, "searchArticles takes a `q` arg");
assert(qArg.type.kind === "NON_NULL" && qArg.type.ofType?.name === "String", "`q` is String!");

// Behavior: searchArticles(q: "internet") returns only articles whose title containsi "internet"
const { json } = await gql(
  `query SearchArticles($q: String!) { searchArticles(q: $q) { documentId title wordCount } }`,
  { q: "internet" }
);
if (json.errors) console.error(JSON.stringify(json.errors));
const arts = json.data?.searchArticles ?? [];
assert(arts.length > 0, `searchArticles("internet") returned >0 results (got ${arts.length})`);
assert(arts.every((a) => /internet/i.test(a.title)), "every result title contains 'internet' (case-insensitive)");
assert(arts.every((a) => typeof a.wordCount === "number"), "wordCount is included on results (Article type extension still works)");

// Same call returns the same set as Shadow CRUD's filtered articles query
// (this proves searchArticles wraps the same Document Service findMany).
const refResult = await gql(
  `{ articles(filters: { title: { containsi: "internet" } }, pagination: { pageSize: 100 }) { documentId } }`
);
const refIds = new Set((refResult.json.data?.articles ?? []).map((a) => a.documentId));
const searchIds = new Set(arts.map((a) => a.documentId));
assert(searchIds.size === refIds.size, `result count matches Shadow CRUD filtered query (search=${searchIds.size}, ref=${refIds.size})`);
for (const id of searchIds) {
  assert(refIds.has(id), `searched documentId ${id} also appears in the Shadow CRUD result`);
}

// Auth bypass: post claims `auth: false`, so unauthenticated calls succeed.
// We've been calling unauthenticated already; this is just an explicit re-confirmation.
assert(!json.errors, "unauthenticated searchArticles call has no errors");

// Empty-result query: a string that matches nothing returns [] without errors.
const noMatch = await gql(
  `query($q: String!) { searchArticles(q: $q) { documentId } }`,
  { q: "zzz-no-such-thing-zzz" }
);
assert(!noMatch.json.errors, "no-match query has no errors");
assert(Array.isArray(noMatch.json.data?.searchArticles) && noMatch.json.data.searchArticles.length === 0, "no-match query returns empty list");

console.log("\nStep 12 OK");
