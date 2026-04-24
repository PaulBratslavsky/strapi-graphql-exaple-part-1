import Link from "next/link";
import { Markdown } from "@/components/markdown";
import { TagBadge } from "@/components/tag-badge";
import { NoteActions } from "@/components/note-actions";
import { PLACEHOLDER_NOTE_DETAIL } from "@/lib/placeholder";

// TODO (Part 3 Step 4): fetch the real note by documentId.
//   import { notFound } from "next/navigation";
//   import { query } from "@/lib/apollo-client";
//   import { NOTE_DETAIL } from "@/lib/graphql";
//   const { data } = await query({ query: NOTE_DETAIL, variables: { documentId } });
//   if (!data?.note) notFound();

export const dynamic = "force-dynamic";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  // documentId is captured for use once the GraphQL query is wired in.
  await params;

  const note = PLACEHOLDER_NOTE_DETAIL;

  return (
    <article className="space-y-6">
      <Link href="/" className="text-sm text-neutral-500 hover:text-black">
        ← Back to notes
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-3xl font-semibold">
            {note.pinned && <span aria-label="pinned">📌</span>}
            {note.title}
          </h1>
          <p className="text-sm text-neutral-500">
            {note.wordCount} words · ~{note.readingTime} min read · updated{" "}
            {new Date(note.updatedAt).toLocaleDateString()}
          </p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((t) => (
                <TagBadge key={t.documentId} tag={t} />
              ))}
            </div>
          )}
        </div>
        <NoteActions documentId={note.documentId} pinned={note.pinned} />
      </header>

      <Markdown>{note.content}</Markdown>
    </article>
  );
}
