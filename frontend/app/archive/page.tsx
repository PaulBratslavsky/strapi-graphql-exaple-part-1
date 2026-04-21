import { HttpLink } from '@apollo/client';
import {
  ApolloClient,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';
import { ARCHIVED_NOTES } from '@/lib/graphql';
import { NoteCard } from '@/components/note-card';

type Note = Parameters<typeof NoteCard>[0]['note'];

export const dynamic = 'force-dynamic';

const STRAPI_GRAPHQL_URL =
  process.env.STRAPI_GRAPHQL_URL ?? 'http://localhost:1338/graphql';

export default async function ArchivePage() {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: STRAPI_GRAPHQL_URL,
      fetch: (url, init) =>
        fetch(url, {
          ...init,
          headers: {
            ...(init?.headers as Record<string, string>),
            'X-Include-Archived': 'yes',
          },
          cache: 'no-store',
        }),
    }),
  });

  const { data } = await client.query<{ notes: Note[] }>({
    query: ARCHIVED_NOTES,
  });

  const notes = data?.notes ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">
          Demonstrates the policy gate: this page sends{' '}
          <code className="font-mono">X-Include-Archived: yes</code>, which the{' '}
          <code className="font-mono">include-archived-requires-header</code>{' '}
          policy allows. Without the header, Strapi would reject the query.
        </p>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No archived notes.</p>
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
