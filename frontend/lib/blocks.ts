type TextNode = { type?: string; text?: string; children?: TextNode[] };
type Block = { type?: string; children?: TextNode[] };

export function blocksToText(blocks: Block[] | null | undefined): string {
  if (!Array.isArray(blocks)) return '';
  const walk = (nodes: TextNode[] | undefined): string =>
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
    .join('\n\n');
}

export function textToBlocks(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\n{2,}/).map((para) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: para }],
  }));
}
