// Part 2 Steps 8 + 9 combined: object types (TagCount, NoteStats) and the
// three custom queries (searchNotes, noteStats, notesByTag).

import { assert, header, gql } from "./_lib.mjs";

header("Part 2 Steps 8 + 9: object types + custom queries");

// 8. Schema
const intro = await gql(`{
  tc: __type(name:"TagCount") { fields { name type { kind ofType { name } } } }
  ns: __type(name:"NoteStats") { fields { name type { kind ofType { name kind ofType { name kind ofType { name } } } } } }
}`);
const tcFields = (intro.json.data?.tc?.fields ?? []).map((f) => f.name);
const nsFields = (intro.json.data?.ns?.fields ?? []).map((f) => f.name);

for (const f of ["slug", "name", "count"]) assert(tcFields.includes(f), `TagCount.${f} present`);
for (const f of ["total", "pinned", "archived", "byTag"]) assert(nsFields.includes(f), `NoteStats.${f} present`);

// 9.1: searchNotes (default excludes archived)
{
  const { json } = await gql(
    `query($q: String!){ searchNotes(query: $q) { documentId title archived } }`,
    { q: "internet" }
  );
  if (json.errors) console.error(JSON.stringify(json.errors));
  const arts = json.data?.searchNotes ?? [];
  assert(arts.length > 0, "searchNotes('internet') returns >0 (we have a 'Pinned about internet' note)");
  assert(arts.every((n) => /internet/i.test(n.title)), "every result has 'internet' in title");
  assert(arts.every((n) => n.archived === false), "default searchNotes excludes archived");
}

// 9.1b: searchNotes(includeArchived: true) returns archived rows too
{
  // The seed has "Old archived note", which contains 'note' in title
  const { json } = await gql(
    `query($q: String!){ searchNotes(query: $q, includeArchived: true) { documentId title archived } }`,
    { q: "note" }
  );
  const arts = json.data?.searchNotes ?? [];
  assert(arts.some((n) => n.archived), "includeArchived: true returns at least one archived match");
}

// 9.1c: pinned-first sort
{
  const { json } = await gql(`query{ searchNotes(query: "") { title pinned } }`);
  // searchNotes with empty query should return all non-archived notes
  // (containsi "" matches everything). Pinned first.
  const arts = json.data?.searchNotes ?? [];
  assert(arts.length > 0, "empty-query searchNotes returns rows");
  // Verify pinned-first ordering: once a non-pinned appears, no pinned should follow
  let seenUnpinned = false;
  for (const n of arts) {
    if (!n.pinned) seenUnpinned = true;
    else if (seenUnpinned) {
      assert(false, `pinned-desc sort violated near "${n.title}"`);
      break;
    }
  }
  console.log("  ok: searchNotes pinned:desc sort holds");
}

// 9.2: noteStats. Counts must match what we know from the seed.
{
  const { json } = await gql(`{
    noteStats { total pinned archived byTag { slug name count } }
  }`);
  if (json.errors) console.error(JSON.stringify(json.errors));
  const s = json.data?.noteStats;
  assert(s, "noteStats returned a value");
  // Relative checks rather than absolute counts: re-running tests can leave extra
  // notes around. The invariants we care about: total >= visible non-archived count,
  // and pinned + archived counts are >=1 from the seed.
  assert(s.total >= 6, `noteStats.total >= 6 (got ${s.total})`);
  assert(s.pinned >= 1, `noteStats.pinned >= 1 (got ${s.pinned})`);
  assert(s.archived >= 1, `noteStats.archived >= 1 (got ${s.archived}; "Old archived note")`);
  assert(Array.isArray(s.byTag) && s.byTag.length === 3, `byTag has 3 items, one per tag (got ${s.byTag?.length})`);
  // Tags: Work=2 (Weekly review + Old archived), Ideas=2 (Gift ideas + Side project), Personal=1 (Gift ideas)
  const byTagMap = Object.fromEntries(s.byTag.map((t) => [t.slug, t]));
  assert((byTagMap.work?.count ?? 0) >= 1, `Work tag count >= 1 (got ${byTagMap.work?.count})`);
  assert((byTagMap.ideas?.count ?? 0) >= 2, `Ideas tag count >= 2 (got ${byTagMap.ideas?.count})`);
  assert((byTagMap.personal?.count ?? 0) >= 1, `Personal tag count >= 1 (got ${byTagMap.personal?.count})`);
  // Sort: count desc, then name asc as tiebreaker. Work and Ideas tied at 2, Ideas
  // comes alphabetically before Work.
  assert(s.byTag[0].count >= s.byTag[1].count && s.byTag[1].count >= s.byTag[2].count, "byTag sorted by count desc");
  // Tiebreaker (count desc, then name asc): if multiple tags share the top count,
  // they should be sorted alphabetically. Verify the post's claim by checking that
  // any tied pair is in alphabetical order.
  for (let i = 1; i < s.byTag.length; i++) {
    if (s.byTag[i - 1].count === s.byTag[i].count) {
      assert(s.byTag[i - 1].name.localeCompare(s.byTag[i].name) <= 0,
        `tiebreaker: ${s.byTag[i - 1].name} comes before ${s.byTag[i].name} when both have count ${s.byTag[i].count}`);
    }
  }
}

// 9.3: notesByTag
{
  const { json } = await gql(
    `query($s: String!){ notesByTag(slug: $s) { documentId title archived tags { slug } } }`,
    { s: "ideas" }
  );
  if (json.errors) console.error(JSON.stringify(json.errors));
  const arts = json.data?.notesByTag ?? [];
  assert(arts.length >= 2, `notesByTag(ideas) has >=2 active notes (got ${arts.length})`);
  assert(arts.every((n) => n.archived === false), "all results are non-archived");
  assert(arts.every((n) => n.tags.some((t) => t.slug === "ideas")), "every result has the 'ideas' tag");
}

// 9.4: notesByTag with no matches returns []
{
  const { json } = await gql(
    `query($s: String!){ notesByTag(slug: $s) { documentId } }`,
    { s: "nonexistent-tag" }
  );
  assert(!json.errors, "no errors for unknown tag");
  assert(Array.isArray(json.data?.notesByTag) && json.data.notesByTag.length === 0, "notesByTag(unknown) returns []");
}

console.log("\nP2 Steps 8 + 9 OK");
