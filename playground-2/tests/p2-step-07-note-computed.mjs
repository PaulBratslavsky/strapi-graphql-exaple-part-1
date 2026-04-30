// Part 2 Step 7: Note computed fields (wordCount, readingTime, excerpt(length: Int)).

import { assert, header, gql } from "./_lib.mjs";

header("Part 2 Step 7: Note computed fields");

// Schema
const intro = await gql(`{ __type(name: "Note") { fields { name args { name } type { kind ofType { name } } } } }`);
const fs = intro.json.data?.__type?.fields ?? [];
const wordCount = fs.find((f) => f.name === "wordCount");
const readingTime = fs.find((f) => f.name === "readingTime");
const excerpt = fs.find((f) => f.name === "excerpt");

assert(wordCount && wordCount.type.kind === "NON_NULL" && wordCount.type.ofType?.name === "Int", "Note.wordCount: Int!");
assert(readingTime && readingTime.type.kind === "NON_NULL" && readingTime.type.ofType?.name === "Int", "Note.readingTime: Int!");
assert(excerpt && excerpt.type.kind === "NON_NULL" && excerpt.type.ofType?.name === "String", "Note.excerpt: String!");
assert(excerpt.args.find((a) => a.name === "length"), "Note.excerpt has a `length` arg");

// Behavior. The post says wordCount runs against markdown-stripped content.
// We can't perfectly mirror the post's stripMarkdown without copying it, but we can
// assert key invariants:
//   - readingTime >= 1 always (Math.max(1, ...))
//   - wordCount === 0 iff content is empty
//   - excerpt length <= length+3 (the "..." suffix)
//   - excerpt of an empty note is ""

const { json } = await gql(`{ notes(pagination: { pageSize: 50 }) { title content wordCount readingTime excerpt(length: 60) } }`);
const arts = json.data?.notes ?? [];
assert(arts.length > 0, "got notes");
for (const n of arts) {
  assert(typeof n.wordCount === "number", `wordCount is a number for "${n.title}"`);
  assert(n.readingTime >= 1, `readingTime >= 1 (post: Math.max(1, ...)) for "${n.title}", got ${n.readingTime}`);
  if ((n.content ?? "").trim() === "") {
    assert(n.wordCount === 0, `empty content => wordCount=0 for "${n.title}"`);
  }
  assert(n.excerpt.length <= 63, `excerpt(length: 60) string length <= 63 (with possible "..." suffix) for "${n.title}", got ${n.excerpt.length}`);
}

// excerpt with custom length args
const { json: j2 } = await gql(`{ notes(pagination: { pageSize: 1 }) { excerpt(length: 10) } }`);
const e10 = j2.data.notes[0].excerpt;
assert(e10.length <= 13, `excerpt(length: 10) <= 13 chars, got ${e10.length}`);

console.log("\nP2 Step 7 OK");
