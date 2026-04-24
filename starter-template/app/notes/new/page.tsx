import Link from "next/link";
import { createNoteAction } from "./actions";
import { PLACEHOLDER_TAGS } from "@/lib/placeholder";

// TODO (Part 3 Step 5): fetch real tags via the TAGS query.
//   const { data } = await query({ query: TAGS });

export const dynamic = "force-dynamic";

export default async function NewNotePage() {
  const tags = PLACEHOLDER_TAGS;

  return (
    <div className="max-w-2xl space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black">
          ← Back to notes
        </Link>
        <h1 className="text-2xl font-semibold">New note</h1>
        <p className="text-sm text-neutral-500">
          Submits the{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
            createNote
          </code>{" "}
          Shadow CRUD mutation. Content is Markdown.
        </p>
      </header>

      <form action={createNoteAction} className="space-y-5">
        <div className="space-y-1">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Untitled note"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block text-sm font-medium">
            Content (Markdown)
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            className="w-full rounded border px-3 py-2 font-mono text-sm"
            placeholder="# Heading&#10;&#10;A paragraph.&#10;&#10;- list item"
          />
        </div>

        {tags.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <label
                  key={t.documentId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 has-[:checked]:border-black has-[:checked]:bg-neutral-100"
                >
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={t.documentId}
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
            Create note
          </button>
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-black"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
