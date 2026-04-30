const WORDS_PER_MINUTE = 200;
const DEFAULT_EXCERPT_LENGTH = 180;

type ArticleSource = { description?: string | null };
type NoteSource = { content?: string | null };

/** Remove common markdown syntax so counts and excerpts reflect rendered text. */
function stripMarkdown(md: string): string {
  return (md ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#+\s+|^>\s+|^[-*+]\s+|^\d+\.\s+/gm, "")
    .replace(/\*\*([^*]*)\*\*|__([^_]*)__/g, (_, a, b) => a ?? b)
    .replace(/\*([^*]*)\*|_([^_]*)_/g, (_, a, b) => a ?? b)
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function truncateAt(text: string, maxLength: number): string {
  return text.length <= maxLength
    ? text
    : text.slice(0, maxLength).trimEnd() + "...";
}

export default function computedFields({
  nexus,
}: {
  nexus: typeof import("nexus");
}) {
  return {
    types: [
      nexus.extendType({
        type: "Article",
        definition(t) {
          t.nonNull.int("wordCount", {
            description: "Word count of the article description.",
            resolve: (parent: ArticleSource) =>
              countWords(parent?.description ?? ""),
          });
        },
      }),

      nexus.extendType({
        type: "Note",
        definition(t) {
          t.nonNull.int("wordCount", {
            description: "Word count of the note body (markdown stripped).",
            resolve: (parent: NoteSource) =>
              countWords(stripMarkdown(parent?.content ?? "")),
          });

          t.nonNull.int("readingTime", {
            description: `Estimated reading time in minutes (${WORDS_PER_MINUTE} wpm).`,
            resolve: (parent: NoteSource) => {
              const words = countWords(stripMarkdown(parent?.content ?? ""));
              return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
            },
          });

          t.nonNull.string("excerpt", {
            description: "First N characters of the note, markdown stripped.",
            args: { length: nexus.intArg({ default: DEFAULT_EXCERPT_LENGTH }) },
            resolve: (parent: NoteSource, { length }: { length: number }) =>
              truncateAt(stripMarkdown(parent?.content ?? ""), length),
          });
        },
      }),
    ],
    resolversConfig: {
      "Article.wordCount": { auth: false },
      "Note.wordCount": { auth: false },
      "Note.readingTime": { auth: false },
      "Note.excerpt": { auth: false },
    },
  };
}
