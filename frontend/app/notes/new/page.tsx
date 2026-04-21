import Link from 'next/link';
import { query } from '@/lib/apollo-client';
import { TAGS } from '@/lib/graphql';
import { Button } from '@/components/ui/button';
import { createNoteAction } from './actions';

type Tag = {
  documentId: string;
  name: string;
  slug: string;
  color?: string | null;
};

export const dynamic = 'force-dynamic';

export default async function NewNotePage() {
  const { data } = await query<{ tags: Tag[] }>({ query: TAGS });
  const tags = data?.tags ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/notes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to notes
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New note</h1>
      </div>

      <form action={createNoteAction} className="space-y-5">
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
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Untitled note"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="text-sm font-medium">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Write your thoughts… (blank line starts a new paragraph)"
          />
          <p className="text-xs text-muted-foreground">
            Plain text for now — separated by blank lines into paragraph blocks.
          </p>
        </div>

        {tags.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <label
                  key={t.documentId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent has-[:checked]:border-foreground has-[:checked]:bg-accent"
                >
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={t.documentId}
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
          <Button type="submit">Create note</Button>
          <Link
            href="/notes"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
