import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/apollo-client';
import { NOTE_DETAIL, TAGS } from '@/lib/graphql';
import { blocksToText } from '@/lib/blocks';
import { Button } from '@/components/ui/button';
import { updateNoteAction } from './actions';

type Tag = {
  documentId: string;
  name: string;
  slug: string;
  color?: string | null;
};

type NoteDetail = {
  documentId: string;
  title: string;
  content: any;
  tags: Tag[];
};

export const dynamic = 'force-dynamic';

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  const [noteRes, tagsRes] = await Promise.all([
    query<{ note: NoteDetail | null }>({
      query: NOTE_DETAIL,
      variables: { documentId },
    }),
    query<{ tags: Tag[] }>({ query: TAGS }),
  ]);

  const note = noteRes.data?.note;
  if (!note) notFound();

  const allTags = tagsRes.data?.tags ?? [];
  const selectedTagIds = new Set(note.tags.map((t) => t.documentId));
  const defaultContent = blocksToText(note.content);

  const boundAction = updateNoteAction.bind(null, documentId);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href={`/notes/${documentId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to note
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit note</h1>
      </div>

      <form action={boundAction} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={note.title}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="text-sm font-medium">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={12}
            defaultValue={defaultContent}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Plain text. Blank lines split into separate paragraph blocks on save.
          </p>
        </div>

        {allTags.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <label
                  key={t.documentId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent has-[:checked]:border-foreground has-[:checked]:bg-accent"
                >
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={t.documentId}
                    defaultChecked={selectedTagIds.has(t.documentId)}
                    className="sr-only"
                  />
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: t.color ?? '#6366f1' }}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit">Save changes</Button>
          <Link
            href={`/notes/${documentId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
