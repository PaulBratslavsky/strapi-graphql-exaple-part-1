import { query } from '@/lib/apollo-client';
import { NOTE_STATS } from '@/lib/graphql';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Stats = {
  total: number;
  pinned: number;
  archived: number;
  byTag: Array<{ slug: string; name: string; count: number }>;
};

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const { data } = await query<{ noteStats: Stats }>({ query: NOTE_STATS });
  const stats = data?.noteStats;

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stats</h1>
        <p className="text-sm text-muted-foreground">
          Aggregated via the <code className="font-mono">noteStats</code> custom
          query.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {stats.total}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pinned</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {stats.pinned}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Archived</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {stats.archived}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          By tag
        </h2>
        <ul className="divide-y rounded-lg border">
          {stats.byTag.map((t) => (
            <li
              key={t.slug}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="font-medium">{t.name}</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {t.count}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
