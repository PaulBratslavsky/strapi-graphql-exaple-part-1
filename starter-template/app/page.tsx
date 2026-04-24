import { NoteCard } from "@/components/note-card";
import { PLACEHOLDER_NOTES } from "@/lib/placeholder";

// TODO (Part 3 Step 3): replace placeholder imports with a real GraphQL call.
//   import { query } from "@/lib/apollo-client";
//   import { ACTIVE_NOTES } from "@/lib/graphql";
//   const { data } = await query<{ notes: Note[] }>({ query: ACTIVE_NOTES });

export const dynamic = "force-dynamic";

export default async function Home() {
  const notes = PLACEHOLDER_NOTES;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Your notes</h1>
        <p className="text-sm text-neutral-500">
          Currently rendering{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
            PLACEHOLDER_NOTES
          </code>
          . Wire up the{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
            notes
          </code>{" "}
          Shadow CRUD query in Step 3.
        </p>
      </header>

      {notes.length === 0 ? (
        <p className="text-sm text-neutral-500">No notes yet.</p>
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
