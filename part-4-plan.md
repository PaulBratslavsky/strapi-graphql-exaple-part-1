# Part 2 Plan — Users, Permissions, and Per-User Content

This is the implementation and writing plan for Part 2 of the Strapi v5 GraphQL Customization tutorial. It builds on top of the existing note-taking demo in this repository. Part 1 covered the GraphQL customization surface with no auth; Part 2 adds user accounts, authentication, and per-user ownership.

## Goals

- Every note belongs to exactly one user. Users only see and modify their own notes.
- Authentication uses Strapi's `users-permissions` plugin (JWT-based) with the standard `register` / `login` GraphQL mutations it ships.
- The Next.js frontend stores the JWT in an HTTP-only cookie so it works naturally with RSC and Server Actions without shipping an Apollo client to the browser.
- All existing custom queries (`searchNotes`, `noteStats`, `notesByTag`) and mutations (`togglePin`, `archiveNote`, `duplicateNote`) continue to work — they just run in the context of the signed-in user.
- No changes to the tutorial style: one concept per file on the backend, one route per concern on the frontend, neutral technical prose in the blog post.

## Non-goals

- Social login / OAuth providers. Part 2 stops at email + password.
- Role-based access control beyond "owner vs not owner" (e.g. admins, read-only viewers, sharing). These are follow-up material.
- Password reset flow and email verification. Valuable for production, out of scope for a tutorial focused on GraphQL authorization patterns.
- Multi-tenancy or organizations. Each user's data is a flat namespace.

## Design decisions (committed)

1. **Auth style:** cookie-stored JWT, HTTP-only, `SameSite=Lax`, `Secure` in production. Read on the server via `cookies()` and attached to Apollo's `HttpLink` via an auth link.
2. **Authorization style:** a two-layer model — **middlewares** for reads (inject `owner` filter), **policies** for writes (load and check ownership before resolver runs). Both are registered through `resolversConfig` on the same resolvers extended in Part 1.
3. **Ownership is mandatory:** a note without an owner is invalid. `owner` is a required relation. A Document Service `beforeCreate` hook assigns `ctx.state.user` as the owner; clients cannot override it.
4. **Login is a separate page, not a modal:** `/login` and `/register` are their own App Router routes, implemented as Server Actions that exchange credentials for a JWT and set the cookie.
5. **Ownership check is unconditional:** the middleware runs on every request, so even anonymous requests see an empty list rather than all notes. A missing JWT => `me.id` is `null` => filter matches nothing.

## Backend changes

### Content model

Add a relation on `Note`:

```json
{
  "owner": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "plugin::users-permissions.user",
    "inversedBy": "notes"
  }
}
```

And the reverse on `users-permissions.user`. Since that schema lives inside `node_modules/@strapi/plugin-users-permissions`, Strapi's convention is to override it via a local extension in `src/extensions/users-permissions/content-types/user/schema.json`.

### New files

Under `graphql-server/src/extensions/graphql/`:

- **`ownership-middlewares.ts`** — exports a factory that returns `resolversConfig` entries attaching an `injectOwnerFilter` middleware to every read that lists notes (`Query.notes`, `Query.searchNotes`, `Query.notesByTag`, `Query.noteStats`). The middleware reads `context.state.user`, rewrites `args.filters` to include `owner: { id: { $eq: user.id } }`, and then calls `next()`. If there is no authenticated user, it injects a filter that matches nothing (`{ id: { $eq: -1 } }` or similar) so anonymous requests return an empty list rather than everyone's data.
- **`ownership-policies.ts`** — exports a factory that attaches an `isNoteOwner` policy to every write mutation on notes (`Mutation.updateNote`, `Mutation.togglePin`, `Mutation.archiveNote`, `Mutation.duplicateNote`). The policy loads the note by `documentId`, compares `owner.id` against `context.state.user.id`, and returns `false` if they differ. `createNote` does not need this policy — ownership is set by the lifecycle hook, not by the client.

Under `graphql-server/src/policies/`:

- **`is-note-owner.ts`** — the named policy referenced by `ownership-policies.ts`. Same pattern as `include-archived-requires-header.ts` from Part 1.

Under `graphql-server/src/api/note/content-types/note/`:

- Add a lifecycle hook in `lifecycles.ts` that sets `data.owner = strapi.requestContext.get()?.state?.user?.id` on `beforeCreate`. This closes the "client can claim any owner" hole.

### Modifications

- `graphql-server/src/extensions/graphql/index.ts` — register the two new factories with `extensionService.use(...)`.
- `graphql-server/src/index.ts` — remove the `grantPublicPermissions` call for Note and Tag. In Part 2 those become authenticated-only. Grant `register` and `login` on the public role so anonymous users can actually sign up and sign in.
- `graphql-server/src/extensions/graphql/middlewares-and-policies.ts` — the existing `include-archived-requires-header` policy stays, but its scope narrows to "archived requires both a session and the header" rather than gating global access.

## Frontend changes

### New files

Under `frontend/`:

- **`app/login/page.tsx`** — Server Component with a form. Submits to a Server Action.
- **`app/login/actions.ts`** — `use server` action that calls the `login` GraphQL mutation, sets an HTTP-only `strapi_jwt` cookie, and redirects to `/notes`.
- **`app/register/page.tsx`** and **`app/register/actions.ts`** — same shape as login, using the `register` mutation.
- **`app/logout/actions.ts`** — Server Action that clears the cookie and redirects to `/login`.
- **`components/auth-nav.tsx`** — a Server Component that reads the cookie, fetches the current user via `Query.me`, and renders either "Sign out" or "Sign in / Sign up" based on state.
- **`middleware.ts`** at the root of `frontend/` — intercepts requests to `/notes`, `/notes/*`, `/stats`, `/archive`, and redirects unauthenticated users to `/login?returnTo=...`.
- **`lib/auth.ts`** — `getJwt()` helper that reads the cookie in server contexts, and constants for the cookie name and options.

### Modifications

- **`lib/apollo-client.ts`** — augment the `HttpLink` with a fetch wrapper that reads the JWT via `getJwt()` and adds `Authorization: Bearer <token>` when present. This runs only in RSC / Server Action contexts, which is where the helper is valid.
- **`lib/graphql.ts`** — add `LOGIN`, `REGISTER`, and `ME` operations alongside the existing ones.
- **`components/nav.tsx`** — render `<AuthNav />` in the header.
- **`app/notes/page.tsx`** — no resolver changes needed; the filter injection happens server-side. But add a "New note" button and a welcome header reading the current user's `username`.

## Blog post outline (Part 2)

Rough structure, mirroring Part 1:

1. **TL;DR** — the pattern: read-side filter injection + write-side ownership policy, plus a cookie-based JWT for RSC.
2. **Why auth is different from authorization** — a short reframe distinguishing authentication (who are you) from authorization (what can you do). The GraphQL customization surface is where authorization lives.
3. **The `users-permissions` plugin** — what it adds to the schema out of the box (`register`, `login`, `me`, `User` type), and why we don't need to write it ourselves.
4. **Step 1: Adding the owner relation** — content-type override for `User.notes`, adding `owner` on `Note`, running a migration, adjusting the seed script.
5. **Step 2: Automatic ownership assignment** — lifecycle hook on `beforeCreate`, why this cannot be done from the client, and how it composes with GraphQL mutations.
6. **Step 3: Read-side filter injection** — walk through `ownership-middlewares.ts`, the context-to-filter mapping, and the "anonymous users see nothing" semantics. Mermaid diagram of request flow with and without JWT.
7. **Step 4: Write-side ownership enforcement** — the `is-note-owner` policy file, how it loads the target note, and why this concern belongs in a policy rather than a middleware (policies run before resolvers and short-circuit cleanly).
8. **Step 5: Registering the extensions** — the aggregator update; one-liner additions to `index.ts`.
9. **Step 6: Cookie-stored JWT in Next.js** — why HTTP-only cookies work better than local storage for RSC + Server Actions, setting the cookie from the login action, reading it in the Apollo link.
10. **Step 7: Login and register pages** — Server Actions calling `login` / `register`, error handling, redirect via `returnTo`.
11. **Step 8: Route protection middleware** — `middleware.ts` at the frontend root, the matcher config, and how it composes with the `returnTo` query string.
12. **Step 9: Displaying the signed-in user** — `<AuthNav />`, `Query.me`, and handling the unauthenticated render gracefully.
13. **Testing the flow end-to-end** — register, log in, create a note, see it appear; open an incognito window, register a second user, confirm you cannot see the first user's notes even with a direct `documentId` URL.
14. **Summary** — the two-layer authorization model as a reusable pattern for any Strapi + GraphQL project, not just this one.
15. **What's left for Part 3** — teaser: sharing notes with other users, role-based access (viewer/editor), social login, password reset.

## Refactor tasks to do before writing Part 2

These are changes to the existing Part 1 code that make Part 2 cleaner to bolt on. They can happen in one PR before Part 2 starts:

1. **Split `src/extensions/graphql/middlewares-and-policies.ts`** into `middlewares.ts` and `policies.ts`. Part 2 adds enough middlewares and policies that the combined file becomes awkward.
2. **Introduce a `src/extensions/graphql/shared/` directory** for helpers used across files: a `getCurrentUser(context)` function, a `buildOwnerFilter(userId)` helper, a shared type for the Nexus factory signature. Today every factory writes these inline.
3. **Remove the `internalNotes` field from `Note`** or rename it to something ownership-related. In Part 1 it was a stand-in for an admin-only field to demonstrate `disableOutput`; in Part 2 the real use case shifts to "owner-only fields" which is a different pattern.
4. **Move `grantPublicPermissions` out of `src/index.ts`** into its own bootstrap file under `src/bootstrap/`. Part 2 adds an analogous `grantAuthenticatedPermissions` step and both belong in a single auditable place.
5. **Add a `Query.me` passthrough in the aggregator** that returns `context.state.user` — trivial to add now, and every Part 2 frontend feature depends on it.
6. **Update `lib/graphql.ts` fragment `NoteFields`** to include `owner { documentId username }` so the UI can show note ownership in preparation for sharing (Part 3).

Doing these as a prep step keeps the Part 2 diff focused on auth rather than bundled with cleanup.

## Open questions to resolve before Part 2 begins

- **Cookie name and scope.** `strapi_jwt` is fine for a demo. Production apps that share a domain with Strapi should namespace it.
- **JWT expiry and refresh.** `users-permissions` issues a long-lived JWT by default (30 days). Part 2 could stop there or introduce a refresh flow; the former is simpler, the latter is more realistic.
- **What happens to existing seeded notes?** The seed script creates notes with no owner. Options: (a) extend the seed to create two demo users and attribute notes to them, (b) require users to create their own notes post-registration and drop the seed from Part 2. Option (a) is better for tutorial screenshots.
- **Error surfacing.** Right now resolver errors bubble as generic GraphQL errors. Part 2 should decide whether ownership failures surface as `FORBIDDEN` codes (letting the UI redirect) or as 404s (hiding the existence of the note). The latter is more privacy-preserving and is the convention most web apps follow.
- **Testing.** Part 2 is a good moment to introduce at least one integration test (Strapi in-memory + supertest) so the ownership model has a verifiable contract. Worth including or defer to a "testing" post?

## Deliverables

- Updated repository on a `part-2` branch, merged to `main` when the post publishes.
- `blog-post-part-2.md` at the repo root alongside the existing `blog-post.md`.
- A brief diff summary added to the README's "What the tutorial covers" section so new readers see there are two parts.
