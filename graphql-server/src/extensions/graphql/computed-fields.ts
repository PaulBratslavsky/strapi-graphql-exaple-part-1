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

const countWords = (text: string) => {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
};

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
            resolve(parent: { description?: string | null }) {
              const text = (parent?.description ?? "").trim();
              return text ? text.split(/\s+/).length : 0;
            },
          });
        },
      }),
      nexus.extendType({
        type: "Note",
        definition(t) {
          t.nonNull.int("wordCount", {
            resolve: (parent: any) =>
              countWords(stripMarkdown(parent?.content)),
          });
          t.nonNull.int("readingTime", {
            description: "Estimated reading time in minutes (200 wpm).",
            resolve: (parent: any) =>
              Math.max(
                1,
                Math.ceil(countWords(stripMarkdown(parent?.content)) / 200),
              ),
          });
          t.nonNull.string("excerpt", {
            args: { length: nexus.intArg({ default: 180 }) },
            resolve: (parent: any, args: { length: number }) => {
              const text = stripMarkdown(parent?.content);
              return text.length <= args.length
                ? text
                : text.slice(0, args.length).trimEnd() + "...";
            },
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