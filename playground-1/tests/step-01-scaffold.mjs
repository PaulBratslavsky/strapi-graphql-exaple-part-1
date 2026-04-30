// Step 1: scaffold a Strapi project. Verifies the post's claims about
// what `npx create-strapi@latest server` (with TypeScript + example data) leaves on disk.

import { assert, header, readJSON, fileExists } from "./_lib.mjs";

header("Step 1: scaffold");

const pkg = readJSON("package.json");
assert(pkg.dependencies["@strapi/strapi"], "@strapi/strapi is a dependency");
assert(pkg.dependencies["@strapi/plugin-users-permissions"], "users-permissions plugin present");
assert(pkg.engines.node.includes("20"), "engines.node mentions Node 20");

// Post claim: three collection types (Article, Author, Category) + two single types (About, Global)
for (const api of ["article", "author", "category", "about", "global"]) {
  assert(fileExists(`src/api/${api}/content-types/${api}/schema.json`), `${api} schema exists`);
}

// Post claim: components live under src/components/shared
assert(fileExists("src/components/shared"), "src/components/shared/ exists");

// Post claim: Article has title, description, slug, cover, blocks, author, category
const articleSchema = readJSON("src/api/article/content-types/article/schema.json");
const a = articleSchema.attributes;
assert(a.title?.type === "string", "article.title is string");
assert(a.description?.type === "text", "article.description is text");
assert(a.slug?.type === "uid", "article.slug is uid");
assert(a.cover?.type === "media", "article.cover is media");
assert(a.blocks?.type === "dynamiczone", "article.blocks is a dynamic zone");
assert(a.author?.relation === "manyToOne", "article.author is manyToOne");
assert(a.category?.relation === "manyToOne", "article.category is manyToOne");

// Post claim (line 261): description max 80 chars
assert(a.description?.maxLength === 80, "article.description maxLength=80");

// Post claim: draftAndPublish is enabled on Article
assert(articleSchema.options?.draftAndPublish === true, "article has draftAndPublish enabled");

console.log("\nStep 1 OK");
