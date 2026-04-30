// Step 9: plugin limits.
// Apply the post's config/plugins.ts (depthLimit, defaultLimit, maxLimit, landingPage,
// apolloServer.introspection) and verify each limit actually changes runtime behavior.
//
// landingPage and apolloServer.introspection only kick in when NODE_ENV=production.
// We test those in step-09b-prod.mjs (separate file) and only test the runtime caps here.

import { assert, header, gql } from "./_lib.mjs";

header("Step 9: plugin limits");

// 9.1: depthLimit. The post says depth 10. A nested query that walks 11+ levels should fail.
//      Use a self-referential traversal: article.author.articles.author.articles...
{
  let q = `{ articles { author { articles { author { articles { author { articles { author { articles { author { articles { documentId } } } } } } } } } } } }`;
  // Count nesting: articles, author, articles, author, articles ... = 11+ field selections deep
  const { json } = await gql(q);
  const errs = json.errors ?? [];
  const depthError = errs.find((e) => /depth/i.test(e.message));
  assert(depthError, `over-nested query is rejected with a depth error (errors: ${JSON.stringify(errs.map(e => e.message))})`);
}

// 9.2: a 4-level nested query is well under the limit and must succeed.
{
  const { json } = await gql(`{ articles { author { articles { documentId } } } }`);
  assert(!json.errors, "shallow query is not affected by depthLimit");
}

// 9.3: defaultLimit + maxLimit need >100 articles in the DB to be observable.
//      Bulk-create 110 articles via createArticle, then probe.
const before = await gql(`{ articles_connection { pageInfo { total } } }`);
const initialTotal = before.json.data?.articles_connection?.pageInfo?.total ?? 0;
console.log(`  initial article count: ${initialTotal}`);

const target = 110;
let created = 0;
const stamp = Date.now();
while (initialTotal + created < target) {
  const r = await gql(
    `mutation Create($d: ArticleInput!){ createArticle(data:$d){ documentId } }`,
    { d: { title: `Limit test ${stamp}-${created}`, description: "x", slug: `limit-${stamp}-${created}` } }
  );
  if (r.json.errors) {
    console.error("  create error:", JSON.stringify(r.json.errors[0]));
    break;
  }
  created++;
}
// Articles are created as drafts under Draft & Publish, so they won't be visible
// to the public `articles` resolver. Publish each one we just created via the
// admin Content Manager API to make them visible.
if (created > 0) {
  const login = await fetch("http://localhost:1337/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@test.local", password: "Testing123!" }),
  });
  const token = (await login.json()).data.token;
  // Pull the documentIds of articles whose title matches our stamp
  const list = await gql(
    `query($q: String!){ articles(filters:{ title: { contains: $q } }, status: DRAFT, pagination: { pageSize: 200 }){ documentId } }`,
    { q: `Limit test ${stamp}` }
  );
  const docs = list.json.data?.articles ?? [];
  for (const a of docs) {
    await fetch(
      `http://localhost:1337/content-manager/collection-types/api::article.article/${a.documentId}/actions/publish`,
      { method: "POST", headers: { authorization: `Bearer ${token}` } }
    );
  }
}

const after = await gql(`{ articles_connection { pageInfo { total } } }`);
const totalNow = after.json.data?.articles_connection?.pageInfo?.total ?? 0;
console.log(`  total after publish: ${totalNow}`);
assert(totalNow >= 100, `have >=100 articles to test caps (got ${totalNow})`);

// 9.4: defaultLimit = 25. Query without pagination should return 25.
{
  const { json } = await gql(`{ articles { documentId } }`);
  const arts = json.data?.articles ?? [];
  assert(arts.length === 25, `defaultLimit caps unspecified pagination at 25 (got ${arts.length})`);
}

// 9.5: maxLimit = 100. Asking for pageSize:1000 should give back at most 100.
{
  const { json } = await gql(`{ articles(pagination: { pageSize: 1000 }) { documentId } }`);
  const arts = json.data?.articles ?? [];
  assert(arts.length === 100, `maxLimit caps oversized pageSize at 100 (got ${arts.length})`);
}

// 9.6: maxLimit also applies to start/limit pagination.
{
  const { json } = await gql(`{ articles(pagination: { start: 0, limit: 1000 }) { documentId } }`);
  const arts = json.data?.articles ?? [];
  assert(arts.length === 100, `maxLimit caps oversized limit at 100 (got ${arts.length})`);
}

console.log("\nStep 9 OK");
