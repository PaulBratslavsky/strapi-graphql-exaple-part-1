import Link from "next/link";
import { updateNoteAction } from "./actions";
import {
  PLACEHOLDER_NOTE_DETAIL,
  PLACEHOLDER_TAGS,
} from "@/lib/placeholder";

// TODO (Part 3 Step 5): fetch the note + tags via GraphQL in parallel.
//   const [noteRes, tagsRes] = await Promise.all([
//     query({ query: NOTE_DETAIL, variables: { documentId } }),
//     query({ query: TAGS }),
//   ]);

export const dynamic = "force-dynamic";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  const note = PLACEHOLDER_NOTE_DETAIL;
  const allTags = PLACEHOLDER_TAGS;
  const selectedTagIds = new Set(note.tags.map((t) => t.documentId));
  const boundAction = updateNoteAction.bind(null, documentId);

  return (
    <div className="max-w-2xl space-y-6">
      <header className="space-y-1">
        <Link
          href={`/notes/${documentId}`}
          className="text-sm text-neutral-500 hover:text-black"
        >
          ← Back to note
        </Link>
        <h1 className="text-2xl font-semibold">Edit note</h1>
        <p className="text-sm text-neutral-500">
          Rendering placeholder data. Wire up{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
            updateNote
          </code>{" "}
          in Step 5.
        </p>
      </header>

      <form action={boundAction} className="space-y-5">
        <div className="space-y-1">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={note.title}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block text-sm font-medium">
            Content (Markdown)
          </label>
          <textarea
            id="content"
            name="content"
            rows={12}
            defaultValue={note.content ?? ""}
            className="w-full rounded border px-3 py-2 font-mono text-sm"
          />
        </div>

        {allTags.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => (
                <label
                  key={t.documentId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 has-[:checked]:border-black has-[:checked]:bg-neutral-100"
                >
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={t.documentId}
                    defaultChecked={selectedTagIds.has(t.documentId)}
                    className="sr-only"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Save changes
          </button>
          <Link
            href={`/notes/${documentId}`}
            className="text-sm text-neutral-500 hover:text-black"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
