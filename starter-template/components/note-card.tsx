import Link from "next/link";
import { TagBadge } from "@/components/tag-badge";

type Note = {
  documentId: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  excerpt: string;
  wordCount: number;
  readingTime: number;
  tags: Array<{
    documentId: string;
    name: string;
    slug: string;
    color?: string | null;
  }>;
};

export function NoteCard({ note }: { note: Note }) {
  return (
    <div className="rounded-lg border p-4 hover:border-neutral-400">
      <Link href={`/notes/${note.documentId}`} className="block space-y-2">
        <div className="flex items-center gap-2 text-base font-medium">
          {note.pinned && <span aria-label="pinned">📌</span>}
          <span className="truncate">{note.title}</span>
        </div>
        <p className="text-xs text-neutral-500">
          {note.wordCount} words · {note.readingTime} min read
        </p>
        <p className="line-clamp-2 text-sm text-neutral-600">{note.excerpt}</p>
      </Link>
      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.tags.map((t) => (
            <TagBadge key={t.documentId} tag={t} />
          ))}
        </div>
      )}
    </div>
  );
}
