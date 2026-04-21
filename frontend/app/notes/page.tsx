import Link from 'next/link';
import { Plus } from 'lucide-react';
import { query } from '@/lib/apollo-client';
import { ACTIVE_NOTES, SEARCH_NOTES } from '@/lib/graphql';
import { NoteCard } from '@/components/note-card';
import { NotesSearch } from '@/components/notes-search';
import { buttonVariants } from '@/components/ui/button';

type Note = Parameters<typeof NoteCard>[0]['note'];

export const dynamic = 'force-dynamic';

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? '').trim();
  const isSearch = term.length > 0;

  const { data } = isSearch
    ? await query<{ searchNotes: Note[] }>({
        query: SEARCH_NOTES,
        variables: { q: term },
      })
    : await query<{ notes: Note[] }>({ query: ACTIVE_NOTES });

  const notes: Note[] = isSearch
    ? (data as { searchNotes: Note[] })?.searchNotes ?? []
    : (data as { notes: Note[] })?.notes ?? [];

  const pinned = isSearch ? [] : notes.filter((n) => n.pinned);
  const rest = isSearch ? notes : notes.filter((n) => !n.pinned);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your notes</h1>
            <p className="text-sm text-muted-foreground">
              {isSearch
                ? `${notes.length} result${notes.length === 1 ? '' : 's'} for “${term}”`
                : `${notes.length} active · sorted by recency`}
            </p>
          </div>
          <Link href="/notes/new" className={buttonVariants({ variant: 'default' })}>
            <Plus className="h-4 w-4" />
            New note
          </Link>
        </div>

        <NotesSearch initialQuery={term} />
      </div>

      {pinned.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pinned
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pinned.map((n) => (
              <NoteCard key={n.documentId} note={n} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        {pinned.length > 0 && !isSearch && (
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            All
          </h2>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {rest.map((n) => (
            <NoteCard key={n.documentId} note={n} />
          ))}
        </div>
      </section>

      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {isSearch ? 'No matches.' : 'No notes yet.'}
        </p>
      )}
    </div>
  );
}
