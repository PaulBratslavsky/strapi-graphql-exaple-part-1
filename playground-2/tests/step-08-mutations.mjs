// Step 8: auto-generated mutations create/update/delete on Article.

import { assert, header, gql } from "./_lib.mjs";

header("Step 8: auto-generated mutations");

// 8.1: create
const create = await gql(
  `mutation CreateArticle($data: ArticleInput!) {
    createArticle(data: $data) { documentId title }
  }`,
  {
    data: {
      title: "Hello from Apollo Sandbox",
      description: "A short article created via GraphQL.",
      slug: `hello-${Date.now()}`,
    },
  }
);
if (create.json.errors) console.error("  errors:", JSON.stringify(create.json.errors));
const created = create.json.data?.createArticle;
assert(created?.documentId, "createArticle returned a documentId");
assert(created.title === "Hello from Apollo Sandbox", "createArticle echoes the title");

// 8.2: update — only the supplied field changes
const update = await gql(
  `mutation UpdateArticle($documentId: ID!, $data: ArticleInput!) {
    updateArticle(documentId: $documentId, data: $data) { documentId title }
  }`,
  { documentId: created.documentId, data: { title: "Edited title" } }
);
if (update.json.errors) console.error("  errors:", JSON.stringify(update.json.errors));
assert(update.json.data?.updateArticle?.title === "Edited title", "updateArticle changes the title");
assert(update.json.data?.updateArticle?.documentId === created.documentId, "updateArticle returns the same documentId");

// 8.3: delete
const del = await gql(
  `mutation DeleteArticle($documentId: ID!) { deleteArticle(documentId: $documentId) { documentId } }`,
  { documentId: created.documentId }
);
assert(del.json.data?.deleteArticle?.documentId === created.documentId, "deleteArticle returns the deleted documentId");

// 8.4: confirm gone
const after = await gql(
  `query Article($documentId: ID!) { article(documentId: $documentId) { documentId } }`,
  { documentId: created.documentId }
);
assert(after.json.data?.article === null, "post-delete fetch returns null");

console.log("\nStep 8 OK");
