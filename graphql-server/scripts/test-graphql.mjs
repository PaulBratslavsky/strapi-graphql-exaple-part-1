// test-graphql.mjs
// Automated validation of Part 2's GraphQL schema.
// Usage: node scripts/test-graphql.mjs
// Requires: Node 18+ and the Strapi dev server running on localhost:1337.

const ENDPOINT = process.env.STRAPI_GRAPHQL_URL ?? "http://localhost:1337/graphql";

let pass = 0;
let fail = 0;
const failed = [];

const gql = async (query, variables, headers = {}) => {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
};

const check = (label, condition, detail = "") => {
  if (condition) {
    console.log(`  ✓ ${label}`);
    pass++;
  } else {
    const line = detail ? `${label} — ${detail}` : label;
    console.log(`  ✗ ${line}`);
    failed.push(line);
    fail++;
  }
};

const section = (name) => console.log(`\n${name}`);

async function main() {
  // Server reachability
  try {
    const ping = await gql("{ __typename }");
    if (!ping?.data) throw new Error("No data");
  } catch (e) {
    console.error(`Cannot reach ${ENDPOINT}. Is npm run develop running?`);
    process.exit(2);
  }

  // 1. Shadow CRUD queries on Note and Tag
  section("Shadow CRUD queries");
  const active = await gql(
    `{ notes(filters: { archived: { eq: false } }, sort: ["pinned:desc","updatedAt:desc"]) {
        documentId title pinned tags { name slug color }
      } }`,
  );
  const activeNotes = active?.data?.notes ?? [];
  check("List active notes returns an array", Array.isArray(activeNotes));
  check(
    "Active notes hydrate the tags relation",
    activeNotes.some((n) => Array.isArray(n.tags)),
  );

  const firstNote = activeNotes[0];
  if (!firstNote) {
    console.error("\nNo active notes in the database. Seed at least one via the admin UI and re-run.");
    process.exit(2);
  }

  // Select `content` too so we exercise the richtext → String mapping
  // referenced by the detail page and Part 3 Step 4.
  const single = await gql(
    `query Note($documentId: ID!) {
       note(documentId: $documentId) { documentId title content }
     }`,
    { documentId: firstNote.documentId },
  );
  check(
    "Fetch by documentId works",
    single?.data?.note?.documentId === firstNote.documentId,
  );
  check(
    "note.content returns a string or null (richtext → String)",
    single?.data?.note?.content === null ||
      typeof single?.data?.note?.content === "string",
  );

  // Array-form sort, matching the corrected Sandbox example in Part 2.
  const tagsResult = await gql(
    `{ tags(sort: ["name:asc"]) { documentId name slug } }`,
  );
  const tagsList = tagsResult?.data?.tags ?? [];
  check("List tags returns an array", Array.isArray(tagsList));

  // Shadow CRUD mutations: createNote + updateNote
  section("Shadow CRUD mutations");
  const createdTitle = `Test note ${Date.now()}`;
  const created = await gql(
    `mutation CreateNote($data: NoteInput!) {
       createNote(data: $data) { documentId title pinned archived }
     }`,
    {
      data: {
        title: createdTitle,
        content: "Created by the validation script.",
        pinned: false,
        archived: false,
        tags: [],
      },
    },
  );
  const createdId = created?.data?.createNote?.documentId;
  check(
    "createNote returns a new Note with the submitted title",
    created?.data?.createNote?.title === createdTitle,
  );

  if (createdId) {
    const updated = await gql(
      `mutation UpdateNote($documentId: ID!, $data: NoteInput!) {
         updateNote(documentId: $documentId, data: $data) { documentId title }
       }`,
      { documentId: createdId, data: { title: `${createdTitle} (updated)` } },
    );
    check(
      "updateNote changes the title of an existing Note",
      updated?.data?.updateNote?.title === `${createdTitle} (updated)`,
    );

    // Tag replacement: updateNote with a different `tags: [...]` array should
    // overwrite the relation. Confirms the "full replacement" behavior the
    // tutorial calls out in Part 3 Step 5.
    if (tagsList[0]) {
      await gql(
        `mutation U($id: ID!, $data: NoteInput!) {
           updateNote(documentId: $id, data: $data) { documentId }
         }`,
        { id: createdId, data: { tags: [tagsList[0].documentId] } },
      );
      const reread = await gql(
        `query N($id: ID!) { note(documentId: $id) { tags { documentId } } }`,
        { id: createdId },
      );
      const newTagIds = (reread?.data?.note?.tags ?? []).map(
        (t) => t.documentId,
      );
      check(
        "updateNote replaces the tags relation when a new array is passed",
        newTagIds.length === 1 && newTagIds[0] === tagsList[0].documentId,
      );
    }

    // Excerpt length argument: `excerpt(length: 10)` should respect the arg
    // (up to 10 chars plus a "..." suffix when truncated).
    const excerptCheck = await gql(
      `query N($id: ID!) { note(documentId: $id) { excerpt(length: 10) } }`,
      { id: createdId },
    );
    const ex = excerptCheck?.data?.note?.excerpt;
    check(
      "excerpt(length: 10) respects the argument",
      typeof ex === "string" && ex.length <= 13,
    );

    // Archive on the primary test note (not just the duplicate from later).
    const archivedDirect = await gql(
      `mutation A($id: ID!) { archiveNote(documentId: $id) { archived } }`,
      { id: createdId },
    );
    check(
      "archiveNote sets archived=true on a fresh note",
      archivedDirect?.data?.archiveNote?.archived === true,
    );
  }

  // 2. Hidden-field confirmations (private: true)
  section("Hidden fields (private: true)");
  const hiddenOutput = await gql(`{ notes { internalNotes } }`);
  check(
    "internalNotes is not selectable on Note",
    hiddenOutput?.errors?.some((e) =>
      e.message.includes('Cannot query field "internalNotes"'),
    ),
  );

  const hiddenFilter = await gql(
    `{ notes(filters: { internalNotes: { containsi: "probe" } }) { documentId } }`,
  );
  check(
    "internalNotes is absent from NoteFiltersInput",
    hiddenFilter?.errors?.some((e) =>
      e.message.includes('"internalNotes" is not defined by type "NoteFiltersInput"'),
    ),
  );

  // 3. Computed fields
  section("Computed fields");
  const computed = await gql(
    `{ notes(pagination: { pageSize: 3 }) { title wordCount readingTime excerpt(length: 60) } }`,
  );
  const cNotes = computed?.data?.notes ?? [];
  check(
    "wordCount is a number on every note",
    cNotes.every((n) => typeof n.wordCount === "number"),
  );
  check(
    "readingTime is a number on every note",
    cNotes.every((n) => typeof n.readingTime === "number"),
  );
  check(
    "excerpt is a string on every note",
    cNotes.every((n) => typeof n.excerpt === "string"),
  );

  // 4. Custom queries
  section("Custom queries");
  const searchTerm = (firstNote.title ?? "").split(/\s+/)[0] || "a";
  const search = await gql(
    `query S($q: String!) { searchNotes(query: $q) { documentId title } }`,
    { q: searchTerm },
  );
  check(
    `searchNotes("${searchTerm}") returns at least one result`,
    (search?.data?.searchNotes ?? []).length > 0,
  );

  const stats = await gql(
    `{ noteStats { total pinned archived byTag { slug name count } } }`,
  );
  const s = stats?.data?.noteStats;
  check(
    "noteStats returns total/pinned/archived as numbers",
    typeof s?.total === "number" &&
      typeof s?.pinned === "number" &&
      typeof s?.archived === "number",
  );
  check("noteStats.byTag is an array", Array.isArray(s?.byTag));

  if (tagsList[0]) {
    const byTag = await gql(
      `query B($slug: String!) { notesByTag(slug: $slug) { documentId title } }`,
      { slug: tagsList[0].slug },
    );
    check(
      `notesByTag(slug: "${tagsList[0].slug}") returns an array`,
      Array.isArray(byTag?.data?.notesByTag),
    );

    // notesByTag should exclude archived notes even when they have the tag.
    const archivedProbeTitle = `Archived probe ${Date.now()}`;
    const probe = await gql(
      `mutation C($data: NoteInput!) {
         createNote(data: $data) { documentId }
       }`,
      {
        data: {
          title: archivedProbeTitle,
          content: "archived probe",
          pinned: false,
          archived: true,
          tags: [tagsList[0].documentId],
        },
      },
    );
    const probeId = probe?.data?.createNote?.documentId;

    const byTagAfter = await gql(
      `query B($slug: String!) { notesByTag(slug: $slug) { documentId } }`,
      { slug: tagsList[0].slug },
    );
    const ids = (byTagAfter?.data?.notesByTag ?? []).map((n) => n.documentId);
    check(
      "notesByTag excludes archived notes",
      !!probeId && !ids.includes(probeId),
    );
    // Leave the probe archived; the next run will re-create (different title).
  }

  // 5. Custom mutations (toggles and duplicates; restores state on success)
  section("Custom mutations");
  const pinBefore = firstNote.pinned;
  const toggle = await gql(
    `mutation T($id: ID!) { togglePin(documentId: $id) { pinned } }`,
    { id: firstNote.documentId },
  );
  check(
    "togglePin flips the pinned flag",
    toggle?.data?.togglePin?.pinned === !pinBefore,
  );
  // Restore original state.
  await gql(`mutation T($id: ID!) { togglePin(documentId: $id) { pinned } }`, {
    id: firstNote.documentId,
  });

  const dup = await gql(
    `mutation D($id: ID!) { duplicateNote(documentId: $id) { documentId title } }`,
    { id: firstNote.documentId },
  );
  const dupTitle = dup?.data?.duplicateNote?.title;
  check(
    "duplicateNote returns a new note titled '<original> (copy)'",
    typeof dupTitle === "string" && dupTitle.endsWith("(copy)"),
  );

  if (dup?.data?.duplicateNote?.documentId) {
    const archived = await gql(
      `mutation A($id: ID!) { archiveNote(documentId: $id) { archived pinned } }`,
      { id: dup.data.duplicateNote.documentId },
    );
    check(
      "archiveNote sets archived=true and pinned=false on the duplicate",
      archived?.data?.archiveNote?.archived === true &&
        archived?.data?.archiveNote?.pinned === false,
    );
  }

  // 6. Policy (include-archived-requires-header)
  section("Policy: include-archived-requires-header");
  const blocked = await gql(
    `{ notes(filters: { archived: { eq: true } }) { title } }`,
  );
  check(
    "Archived filter without header is rejected (Policy Failed)",
    blocked?.errors?.some((e) => e.message.includes("Policy Failed")),
  );

  const allowed = await gql(
    `{ notes(filters: { archived: { eq: true } }) { title } }`,
    undefined,
    { "X-Include-Archived": "yes" },
  );
  check(
    "Archived filter with X-Include-Archived: yes is allowed",
    !allowed?.errors,
  );

  // Summary
  console.log(`\n${pass} passed, ${fail} failed`);
  if (failed.length) {
    console.log("\nFailures:");
    failed.forEach((f) => console.log(`  • ${f}`));
  }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
