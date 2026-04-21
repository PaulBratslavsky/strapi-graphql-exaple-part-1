type TextNode = {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

type Block = {
  type: string;
  level?: number;
  format?: 'ordered' | 'unordered';
  children?: Array<TextNode | Block>;
};

function renderChildren(children: Block['children'], keyBase: string) {
  if (!Array.isArray(children)) return null;
  return children.map((child, i) => {
    const key = `${keyBase}-${i}`;
    if ('text' in child && typeof child.text === 'string') {
      let out: React.ReactNode = child.text;
      if (child.bold) out = <strong key={`b-${key}`}>{out}</strong>;
      if (child.italic) out = <em key={`i-${key}`}>{out}</em>;
      if (child.code)
        out = (
          <code
            key={`c-${key}`}
            className="rounded bg-muted px-1 py-0.5 text-sm font-mono"
          >
            {out}
          </code>
        );
      return <span key={key}>{out}</span>;
    }
    return <BlockNode key={key} block={child as Block} path={key} />;
  });
}

function BlockNode({ block, path }: { block: Block; path: string }) {
  const children = renderChildren(block.children, path);
  switch (block.type) {
    case 'heading': {
      const level = Math.min(Math.max(block.level ?? 2, 1), 6);
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag className="mt-6 font-semibold">{children}</Tag>;
    }
    case 'list': {
      const List = block.format === 'ordered' ? 'ol' : 'ul';
      return (
        <List className="my-3 ml-6 list-disc space-y-1">{children}</List>
      );
    }
    case 'list-item':
      return <li>{children}</li>;
    case 'quote':
      return (
        <blockquote className="my-4 border-l-2 pl-4 italic text-muted-foreground">
          {children}
        </blockquote>
      );
    case 'code':
      return (
        <pre className="my-4 overflow-x-auto rounded-md bg-muted p-4 text-sm">
          <code>{children}</code>
        </pre>
      );
    case 'paragraph':
    default:
      return <p className="my-3 leading-7">{children}</p>;
  }
}

export function BlocksRenderer({ blocks }: { blocks: Block[] | null | undefined }) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">(empty)</p>
    );
  }
  return (
    <div>
      {blocks.map((b, i) => (
        <BlockNode key={`root-${i}`} block={b} path={`root-${i}`} />
      ))}
    </div>
  );
}
