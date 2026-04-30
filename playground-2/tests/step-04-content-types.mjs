// Step 4: the post claims Shadow CRUD generates queries+mutations for every seeded
// content type as soon as Strapi boots. Verify that.

import { assert, header, gql } from "./_lib.mjs";

header("Step 4: Shadow CRUD surface");

// Pull the Query and Mutation root types and check the field names the post mentions.
const { json } = await gql(`{
  __schema {
    queryType { fields { name } }
    mutationType { fields { name } }
  }
}`);
const queries = (json.data?.__schema?.queryType?.fields ?? []).map((f) => f.name);
const mutations = (json.data?.__schema?.mutationType?.fields ?? []).map((f) => f.name);

// Collection-type queries: singular + plural for each content type
for (const name of ["article", "articles", "author", "authors", "category", "categories"]) {
  assert(queries.includes(name), `query "${name}" exists`);
}
// Single-type queries: about, global
for (const name of ["about", "global"]) {
  assert(queries.includes(name), `query "${name}" exists`);
}

// Mutations: createArticle, updateArticle, deleteArticle (Shadow CRUD generates these per CT).
for (const name of [
  "createArticle", "updateArticle", "deleteArticle",
  "createAuthor", "updateAuthor", "deleteAuthor",
  "createCategory", "updateCategory", "deleteCategory",
]) {
  assert(mutations.includes(name), `mutation "${name}" exists`);
}

console.log("\nStep 4 OK");
