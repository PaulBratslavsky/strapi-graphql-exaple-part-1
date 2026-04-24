import Link from "next/link";
import { NoteCard } from "@/components/note-card";
import { PLACEHOLDER_NOTES } from "@/lib/placeholder";

// TODO (Part 3 Step 7): wire this page to the notesByTag custom query.
//   import { query } from "@/lib/apollo-client";
//   import { NOTES_BY_TAG } from "@/lib/graphql";
//   const { data } = await query({ query: NOTES_BY_TAG, variables: { slug } });

export const dynamic = "force-dynamic";

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Pretend the current tag matches by filtering the placeholder set.
  const notes = PLACEHOLDER_NOTES.filter((n) =>
    n.tags.some((t) => t.slug === slug),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black">
          ← Back to notes
        </Link>
        <h1 className="text-2xl font-semibold">
          Notes tagged{" "}
          <code className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-lg">
            {slug}
          </code>
        </h1>
        <p className="text-sm text-neutral-500">
          Not wired yet. Step 7 connects this page to the{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
            notesByTag
          </code>{" "}
          custom query (nested relation filter).
        </p>
      </header>

      {notes.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No placeholder notes match the tag{" "}
          <code className="font-mono">{slug}</code>.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((n) => (
            <NoteCard key={n.documentId} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}
