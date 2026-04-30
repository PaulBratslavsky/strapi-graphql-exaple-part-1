// Part 2 Step 1: Tag content type.

import { assert, header, gql, fileExists, readJSON } from "./_lib.mjs";

header("Part 2 Step 1: Tag content type");

assert(fileExists("src/api/tag/content-types/tag/schema.json"), "tag schema.json exists");
const tag = readJSON("src/api/tag/content-types/tag/schema.json");
assert(tag.options?.draftAndPublish === false, "Tag has draftAndPublish: false (post says uncheck D&P)");
assert(tag.attributes.name?.type === "string" && tag.attributes.name?.required === true, "name is required string");
assert(tag.attributes.slug?.type === "uid" && tag.attributes.slug?.targetField === "name", "slug is uid attached to name");
assert(tag.attributes.color?.type === "enumeration", "color is enumeration");
const enumVals = tag.attributes.color?.enum ?? [];
assert(JSON.stringify(enumVals) === JSON.stringify(["red","blue","green","yellow","purple","gray"]), "enum values match the post exactly");
assert(tag.attributes.color?.default === "gray", "color default is gray");

// Schema-level: Tag GraphQL type and queries exist
const schemaIntro = await gql(`{
  q: __type(name: "Query") { fields { name } }
  m: __type(name: "Mutation") { fields { name } }
  t: __type(name: "Tag") { fields { name } }
}`);
const queries = (schemaIntro.json.data?.q?.fields ?? []).map((f) => f.name);
const mutations = (schemaIntro.json.data?.m?.fields ?? []).map((f) => f.name);
const tagFields = (schemaIntro.json.data?.t?.fields ?? []).map((f) => f.name);

for (const q of ["tag", "tags"]) assert(queries.includes(q), `Query.${q} exists`);
for (const m of ["createTag", "updateTag", "deleteTag"]) assert(mutations.includes(m), `Mutation.${m} exists`);
for (const f of ["name", "slug", "color"]) assert(tagFields.includes(f), `Tag.${f} in schema`);

console.log("\nP2 Step 1 OK");
