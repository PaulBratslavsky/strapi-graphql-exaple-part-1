type TextChild = { type?: string; text?: string; children?: TextChild[] };
type Block = { type?: string; children?: TextChild[] };

function blocksToText(blocks: Block[] | null | undefined): string {
  if (!Array.isArray(blocks)) return '';
  const walk = (nodes: TextChild[] | undefined): string =>
    Array.isArray(nodes)
      ? nodes
          .map((n) =>
            typeof n?.text === 'string' ? n.text : walk(n?.children),
          )
          .join('')
      : '';
  return blocks
    .map((block) => walk(block?.children))
    .filter(Boolean)
    .join('\n');
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export default function computedFields({
  nexus,
}: {
  nexus: typeof import('nexus');
}) {
  return {
    types: [
      nexus.extendType({
        type: 'Note',
        definition(t) {
          t.nonNull.int('wordCount', {
            resolve(parent: { content?: Block[] | null }) {
              return countWords(blocksToText(parent?.content));
            },
          });
          t.nonNull.int('readingTime', {
            description: 'Estimated reading time in minutes (200 wpm).',
            resolve(parent: { content?: Block[] | null }) {
              const words = countWords(blocksToText(parent?.content));
              return Math.max(1, Math.ceil(words / 200));
            },
          });
          t.nonNull.string('excerpt', {
            args: { length: nexus.intArg({ default: 180 }) },
            resolve(
              parent: { content?: Block[] | null },
              args: { length: number },
            ) {
              const text = blocksToText(parent?.content)
                .replace(/\s+/g, ' ')
                .trim();
              if (text.length <= args.length) return text;
              return text.slice(0, args.length).trimEnd() + '…';
            },
          });
        },
      }),
    ],
    resolversConfig: {
      'Note.wordCount': { auth: false },
      'Note.readingTime': { auth: false },
      'Note.excerpt': { auth: false },
    },
  };
}
