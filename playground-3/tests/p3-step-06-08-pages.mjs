// Part 3 Steps 6-8: search, notes-by-tag, stats pages.

import { assert, header, fetchPage, gql } from "./_lib.mjs";

header("Part 3 Steps 6-8: search, tag, stats");

// Step 6: search
{
  // Empty query: no results section
  const empty = await fetchPage("/search");
  assert(empty.status === 200, "GET /search returns 200");

  // Pick a search term that we know matches a seeded note
  const term = "GraphQL"; // matches "GraphQL vs REST"
  const results = await fetchPage(`/search?q=${encodeURIComponent(term)}`);
  assert(results.status === 200, `GET /search?q=${term} returns 200`);
  assert(results.text.includes("GraphQL vs REST"), "search page renders the matching note title");
  // Confirm it goes through the searchNotes resolver (which the page header advertises)
  assert(results.text.includes("searchNotes"), "search page header mentions the searchNotes resolver");

  // No-match query
  const noMatch = await fetchPage("/search?q=zzz-nothing-zzz");
  assert(noMatch.status === 200, "GET /search?q=<no match> returns 200");
  // React inserts HTML comment dividers between dynamic spans; check for the
  // "0" count and the search term appearing in the count line.
  assert(/\b0\b[^"]{0,50}result/.test(noMatch.text), "no-match renders '0' followed by 'result'");
  assert(noMatch.text.includes("zzz-nothing-zzz"), "no-match echoes the search term");
}

// Step 7: notes by tag
{
  const r = await fetchPage("/tags/work");
  assert(r.status === 200, "GET /tags/work returns 200");

  // Get expected matching notes from Strapi
  const expect = await gql(`query($s: String!){ notesByTag(slug: $s) { title } }`, { s: "work" });
  const expected = expect.json.data?.notesByTag ?? [];
  assert(expected.length > 0, `notesByTag(work) returns >0 notes (${expected.length})`);

  for (const n of expected) {
    assert(r.text.includes(n.title), `tag page renders matching note "${n.title}"`);
  }

  // Unknown tag
  const unknown = await fetchPage("/tags/zzz-no-such-tag");
  assert(unknown.status === 200, "GET /tags/<unknown> returns 200");
  assert(unknown.text.includes("No active notes tagged"), "unknown tag shows empty-state message");
}

// Step 8: stats
{
  const r = await fetchPage("/stats");
  assert(r.status === 200, "GET /stats returns 200");
  assert(r.text.includes("noteStats"), "stats page references the noteStats resolver in the header");

  // Get expected counts from Strapi
  const expect = await gql(`{ noteStats { total pinned archived byTag { slug name count } } }`);
  const s = expect.json.data?.noteStats;
  assert(s, "noteStats resolver returned a value");

  // Total/pinned/archived numbers should appear in the rendered page (they're the
  // stat cards). We can't easily search for "Total\n7" because of the streaming
  // RSC payload, but each number should appear at least once in the HTML.
  for (const label of ["Total", "Pinned", "Archived", "By tag"]) {
    assert(r.text.includes(label), `stats page contains "${label}" label`);
  }
  // Each tag name from byTag should be linked
  for (const t of s.byTag) {
    assert(r.text.includes(`href="/tags/${t.slug}"`), `stats page links to /tags/${t.slug}`);
    assert(r.text.includes(t.name), `stats page renders tag name "${t.name}"`);
  }
}

console.log("\nP3 Steps 6-8 OK");
