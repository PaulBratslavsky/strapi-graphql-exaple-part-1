# Starter template for Part 3

Next.js 16 App Router skeleton for the Strapi v5 GraphQL tutorial series.
Every UI component, layout, and page is already built — only the GraphQL
integration is missing. Part 3 of the tutorial walks you through filling it
in, one operation at a time.

## What is wired up vs. what you will add

**Already in place:**

- Layout, navigation, Tailwind styles
- `NoteCard`, `NoteActions`, `NotesSearch`, `TagBadge`, `Markdown` components
- All routes: `/`, `/search`, `/stats`, `/tags/[slug]`, `/notes/new`,
  `/notes/[documentId]`, `/notes/[documentId]/edit`
- `lib/placeholder.ts` with hardcoded data so every page renders immediately

**Empty or stubbed for the tutorial to fill in:**

- `lib/apollo-client.ts` — contains a commented-out skeleton. Filled in Step 2.
- `lib/graphql.ts` — empty. Each step adds one `gql` document.
- Every page imports from `lib/placeholder.ts` today. Each step swaps one
  import for a real `query(...)` call.
- Every Server Action (`createNoteAction`, `updateNoteAction`,
  `togglePinAction`, `archiveNoteAction`) currently `console.log`s its input.
  Step 5 wires them to the real mutations.

## Quick start

```bash
cp .env.local.example .env.local   # adjust STRAPI_GRAPHQL_URL if needed
npm install
npm run dev
```

Open `http://localhost:3001`. You will see the home page rendering placeholder
notes. Open part-3.md and work through the steps.

## Prerequisites

- The Part 2 Strapi backend running at `http://localhost:1338/graphql`
  (see `graphql-server/` in the sibling directory).
- Node.js 20.9+.

## When you finish

After Step 8 of Part 3:

- `lib/placeholder.ts` is no longer imported anywhere (safe to delete).
- `lib/graphql.ts` contains every `gql` document the frontend uses.
- `lib/apollo-client.ts` exports `query`, `getClient`, and `PreloadQuery`.
- Every page reads from Strapi; every Server Action writes to Strapi.

The end state matches the completed `frontend/` project in the repo root.

## Looking ahead to Part 4

Part 4 adds authentication (JWT cookie, `/login` and `/register` routes, route-
protection middleware, per-user ownership). It touches a small set of files
that already exist in the starter as stubs:

- `lib/auth.ts` — currently returns `null`. Part 4 replaces the body to read
  the `strapi_jwt` HTTP-only cookie set by the login Server Action.
- `lib/apollo-client.ts` — Part 4 augments the `HttpLink` with a `fetch`
  wrapper that calls `getJwt()` and attaches the `Authorization` header. The
  forward-pointer comment in that file shows the exact shape.
- `components/nav.tsx` — Part 4 swaps the bare link list for `<AuthNav />`
  (a Server Component that reads the JWT and renders user-aware chrome).

Part 4 also adds new files (`app/login/*`, `app/register/*`, `middleware.ts`,
`components/auth-nav.tsx`) and a couple of new `gql` operations
(`LOGIN`, `REGISTER`, `ME`). None of that needs to exist during Part 3.
