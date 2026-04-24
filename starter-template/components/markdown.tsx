import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string | null | undefined }) {
  const source = (children ?? "").trim();
  if (!source) {
    return <p className="text-sm italic text-neutral-500">(empty)</p>;
  }
  return (
    <div className="prose prose-sm prose-neutral max-w-none">
      <ReactMarkdown>{source}</ReactMarkdown>
    </div>
  );
}
