import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pin } from 'lucide-react';
import { query } from '@/lib/apollo-client';
import { NOTE_DETAIL } from '@/lib/graphql';
import { BlocksRenderer } from '@/components/blocks-renderer';
import { TagBadge } from '@/components/tag-badge';
import { NoteActions } from '@/components/note-actions';

type NoteDetail = {
  documentId: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  wordCount: number;
  readingTime: number;
  updatedAt: string;
  content: any;
  tags: Array<{ documentId: string; name: string; slug: string; color?: string | null }>;
};

export const dynamic = 'force-dynamic';

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  const { data } = await query<{ note: NoteDetail | null }>({
    query: NOTE_DETAIL,
    variables: { documentId },
  });

  const note = data?.note;
  if (!note) notFound();

  return (
    <article className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/notes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to notes
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
              {note.pinned && <Pin className="h-5 w-5 text-amber-500" />}
              {note.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {note.wordCount} words · ~{note.readingTime} min read · updated{' '}
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
        </div>
      </div>

      <div className="prose prose-sm max-w-none">
        <BlocksRenderer blocks={note.content} />
      </div>
    </article>
  );
}
