import { NoteCard } from "@/components/note-card";
import { NotesSearch } from "@/components/notes-search";

// TODO (Part 3 Step 6): wire this page to the searchNotes custom query.
//   import { query } from "@/lib/apollo-client";
//   import { SEARCH_NOTES } from "@/lib/graphql";
//   const { data } = await query({ query: SEARCH_NOTES, variables: { q: term } });

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="text-sm text-neutral-500">
          Not wired yet. Step 6 connects this page to the{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
            searchNotes
          </code>{" "}
          custom query.
        </p>
      </header>

      <NotesSearch initialQuery={term} />

      {term && (
        <p className="text-sm text-neutral-500">
          You searched for &ldquo;{term}&rdquo;. Zero results until the GraphQL
          wiring is added.
        </p>
      )}
    </div>
  );
}
