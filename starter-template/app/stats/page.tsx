import Link from "next/link";
import { PLACEHOLDER_STATS } from "@/lib/placeholder";

// TODO (Part 3 Step 8): wire this page to the noteStats custom query.
//   import { query } from "@/lib/apollo-client";
//   import { NOTE_STATS } from "@/lib/graphql";
//   const { data } = await query({ query: NOTE_STATS });

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const stats = PLACEHOLDER_STATS;

  const counts = [
    { label: "Total", value: stats.total },
    { label: "Pinned", value: stats.pinned },
    { label: "Archived", value: stats.archived },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Stats</h1>
        <p className="text-sm text-neutral-500">
          Aggregated via the{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
            noteStats
          </code>{" "}
          custom query, which returns the{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
            NoteStats
          </code>{" "}
          object type with a per-tag{" "}
          <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs">
            TagCount
          </code>{" "}
          breakdown.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {counts.map((c) => (
          <div key={c.label} className="rounded-lg border p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {c.label}
            </div>
            <div className="mt-1 text-3xl font-semibold">{c.value}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          By tag
        </h2>
        <ul className="divide-y rounded-lg border">
          {stats.byTag.map((t) => (
            <li
              key={t.slug}
              className="flex items-center justify-between px-4 py-3"
            >
              <Link
                href={`/tags/${t.slug}`}
                className="font-medium hover:underline"
              >
                {t.name}
              </Link>
              <span className="text-sm tabular-nums text-neutral-500">
                {t.count}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
