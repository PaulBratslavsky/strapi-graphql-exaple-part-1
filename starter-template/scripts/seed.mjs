// seed.mjs
// Populates the Part 2 Strapi backend with demo tags and notes via the GraphQL
// API so the Part 3 frontend has something to render.
//
// Usage: node scripts/seed.mjs
// Env:   STRAPI_GRAPHQL_URL (defaults to http://localhost:1337/graphql)
//
// Idempotent: tags are matched by slug, notes by title. Re-running this script
// does not create duplicates. To reset, delete the entries in the Strapi
// admin UI (Content Manager → Tags / Notes) and re-run.

const ENDPOINT =
  process.env.STRAPI_GRAPHQL_URL ?? "http://localhost:1337/graphql";

const gql = async (query, variables, headers = {}) => {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
};

const die = (msg, detail) => {
  console.error(`\n${msg}`);
  if (detail) console.error(detail);
  process.exit(1);
};

// Reachability check
try {
  const ping = await gql("{ __typename }");
  if (!ping?.data) throw new Error("No data field in response");
} catch (e) {
  die(
    `Cannot reach ${ENDPOINT}. Is the Part 2 Strapi backend running on :1337?`,
    String(e),
  );
}

// 1. Tags. Idempotent: look up by slug, create if missing.
const tagSeeds = [
  { name: "Ideas", slug: "ideas", color: "blue" },
  { name: "Work", slug: "work", color: "purple" },
  { name: "Personal", slug: "personal", color: "green" },
  { name: "Bugs", slug: "bugs", color: "red" },
  { name: "Drafts", slug: "drafts", color: "gray" },
];

const tagIdsBySlug = {};

console.log("\nSeeding tags...");
for (const tag of tagSeeds) {
  const existing = await gql(
    `query T($slug: String!) {
      tags(filters: { slug: { eq: $slug } }) { documentId name slug }
    }`,
    { slug: tag.slug },
  );
  const found = existing?.data?.tags?.[0];
  if (found) {
    tagIdsBySlug[tag.slug] = found.documentId;
    console.log(`  · ${tag.name} (${tag.slug}) — already exists`);
    continue;
  }

  const created = await gql(
    `mutation C($data: TagInput!) {
      createTag(data: $data) { documentId name slug }
    }`,
    { data: tag },
  );
  if (created?.errors || !created?.data?.createTag?.documentId) {
    die(
      `Failed to create tag '${tag.name}'`,
      JSON.stringify(created?.errors ?? created, null, 2),
    );
  }
  tagIdsBySlug[tag.slug] = created.data.createTag.documentId;
  console.log(`  ✓ ${tag.name} (${tag.slug}) — created`);
}

// 2. Notes. Idempotent: look up by title, create if missing.
//    A mix of active/pinned/archived so the home, search, stats, and detail
//    pages all have something interesting to render.
const noteSeeds = [
  {
    title: "Welcome to your notes",
    content:
      "# Welcome\n\nThis is a demo note seeded by `scripts/seed.mjs`. It is **pinned** so it shows up at the top of the home page.\n\nEdit, archive, or delete it from the inline actions on the detail page.",
    pinned: true,
    archived: false,
    tagSlug: "personal",
  },
  {
    title: "GraphQL vs REST",
    content:
      "Quick rundown of when each shines. GraphQL gives the client full control over the response shape; REST is dead simple to cache. Strapi v5 ships both out of the box.",
    pinned: true,
    archived: false,
    tagSlug: "ideas",
  },
  {
    title: "Refactor the auth middleware",
    content:
      "Pull the JWT verification into a shared helper. The current copy lives in three places.\n\n- [ ] Extract `verifyToken`\n- [ ] Replace duplicates\n- [ ] Add unit tests",
    pinned: false,
    archived: false,
    tagSlug: "work",
  },
  {
    title: "Weekend reading list",
    content:
      "- *Designing Data-Intensive Applications*\n- The latest Strapi v5 release notes\n- A long blog post about RSC tradeoffs",
    pinned: false,
    archived: false,
    tagSlug: "personal",
  },
  {
    title: "Bug: tag color enum mismatch",
    content:
      "The Tag schema enumerates `red, blue, green, yellow, purple, gray` but the frontend palette has an extra `orange` entry. Either drop it from the palette or add it to the enum.",
    pinned: false,
    archived: false,
    tagSlug: "bugs",
  },
  {
    title: "Draft: announcing the new feature",
    content:
      "*Draft, do not publish.*\n\nWe shipped soft-delete on the public API. Worth a short post explaining the contract: callers can never filter on `archived` directly, the server alone manages it.",
    pinned: false,
    archived: false,
    tagSlug: "drafts",
  },
  {
    title: "Grocery list",
    content: "- Bread\n- Coffee\n- Olive oil\n- Whatever Marta wants",
    pinned: false,
    archived: false,
    tagSlug: "personal",
  },
  {
    title: "Old draft to archive",
    content:
      "This note is archived to demonstrate soft-delete. It does not appear on the home page, search, or tag pages, and a direct fetch by `documentId` returns NOT_FOUND.",
    pinned: false,
    archived: true,
    tagSlug: "drafts",
  },
  {
    title: "Last quarter's bug list",
    content:
      "Closed and archived after Q1 cleanup. Kept for historical reference but should not surface in active views.",
    pinned: false,
    archived: true,
    tagSlug: "bugs",
  },
];

console.log("\nSeeding notes...");
for (const note of noteSeeds) {
  const existing = await gql(
    `query N($title: String!) {
      notes(filters: { title: { eq: $title } }) { documentId title }
    }`,
    { title: note.title },
  );
  if (existing?.data?.notes?.[0]) {
    console.log(`  · ${note.title} — already exists`);
    continue;
  }

  const tagId = tagIdsBySlug[note.tagSlug];
  const data = {
    title: note.title,
    content: note.content,
    pinned: note.pinned,
    tags: tagId ? [tagId] : [],
  };

  const created = await gql(
    `mutation C($data: NoteInput!) {
      createNote(data: $data) { documentId title pinned }
    }`,
    { data },
  );
  if (created?.errors || !created?.data?.createNote?.documentId) {
    die(
      `Failed to create note '${note.title}'`,
      JSON.stringify(created?.errors ?? created, null, 2),
    );
  }

  // archiveNote is a separate mutation because the soft-delete middlewares
  // reject any caller-supplied archived filter on Query.notes; the
  // Mutation.archiveNote resolver is the only sanctioned way to set it.
  if (note.archived) {
    const archived = await gql(
      `mutation A($id: ID!) { archiveNote(documentId: $id) { archived } }`,
      { id: created.data.createNote.documentId },
    );
    if (archived?.errors || archived?.data?.archiveNote?.archived !== true) {
      die(
        `Created '${note.title}' but failed to archive it`,
        JSON.stringify(archived?.errors ?? archived, null, 2),
      );
    }
    console.log(`  ✓ ${note.title} — created + archived`);
  } else {
    console.log(
      `  ✓ ${note.title} — created${note.pinned ? " (pinned)" : ""}`,
    );
  }
}

console.log("\nSeed complete.");
console.log(
  `Open http://localhost:3000 to see the active notes, or curl ${ENDPOINT} to query directly.`,
);
