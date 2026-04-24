// Placeholder data used while the starter is not yet wired to the Strapi
// GraphQL backend. Each step of Part 3 replaces one of these imports with a
// real Apollo query so the UI moves from static to live data.
//
// All shapes mirror what the finished GraphQL fragment / queries return.
// Once you wire up Apollo in Step 2 and start adding queries, you can delete
// this file.

export type PlaceholderTag = {
  documentId: string;
  name: string;
  slug: string;
  color: string | null;
};

export type PlaceholderNote = {
  documentId: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  updatedAt: string;
  wordCount: number;
  readingTime: number;
  excerpt: string;
  tags: PlaceholderTag[];
};

export type PlaceholderNoteDetail = PlaceholderNote & {
  content: string | null;
};

export type PlaceholderStats = {
  total: number;
  pinned: number;
  archived: number;
  byTag: Array<{ slug: string; name: string; count: number }>;
};

export const PLACEHOLDER_TAGS: PlaceholderTag[] = [
  { documentId: "tag-work", name: "Work", slug: "work", color: "blue" },
  {
    documentId: "tag-personal",
    name: "Personal",
    slug: "personal",
    color: "green",
  },
  { documentId: "tag-ideas", name: "Ideas", slug: "ideas", color: "yellow" },
];

export const PLACEHOLDER_NOTES: PlaceholderNote[] = [
  {
    documentId: "placeholder-1",
    title: "Placeholder: weekly review",
    pinned: true,
    archived: false,
    updatedAt: "2026-04-01T00:00:00.000Z",
    wordCount: 24,
    readingTime: 1,
    excerpt:
      "This is a static placeholder note. Wire up the ACTIVE_NOTES query in Part 3 Step 3 to replace it with real data from Strapi.",
    tags: [PLACEHOLDER_TAGS[0]],
  },
  {
    documentId: "placeholder-2",
    title: "Placeholder: gift ideas",
    pinned: false,
    archived: false,
    updatedAt: "2026-03-28T00:00:00.000Z",
    wordCount: 15,
    readingTime: 1,
    excerpt:
      "Another placeholder. Until you plug in Apollo, every list view reads from lib/placeholder.ts.",
    tags: [PLACEHOLDER_TAGS[1]],
  },
  {
    documentId: "placeholder-3",
    title: "Placeholder: side-project backlog",
    pinned: false,
    archived: false,
    updatedAt: "2026-03-20T00:00:00.000Z",
    wordCount: 18,
    readingTime: 1,
    excerpt:
      "Click a tag to see where the per-tag route lives, but it will keep rendering placeholders until Step 6.",
    tags: [PLACEHOLDER_TAGS[2], PLACEHOLDER_TAGS[1]],
  },
];

export const PLACEHOLDER_NOTE_DETAIL: PlaceholderNoteDetail = {
  ...PLACEHOLDER_NOTES[0],
  content:
    "# Placeholder detail view\n\nThis page shows placeholder Markdown until you replace the import with a real GraphQL query.\n\n- Wire up Apollo in Step 2.\n- Add the `NOTE_DETAIL` query in Step 4.\n- Swap this placeholder import for `query({ query: NOTE_DETAIL, variables: { documentId } })`.",
};

export const PLACEHOLDER_STATS: PlaceholderStats = {
  total: 0,
  pinned: 0,
  archived: 0,
  byTag: [],
};
