**TL;DR**

- This post builds a fresh Strapi v5 project from zero, installs the GraphQL plugin, creates one content type, and walks through every query and mutation the plugin generates for it automatically.
- Once the auto-generated schema is working, we add three small customizations: plugin limits, one computed field, and one custom query. Nothing advanced — just enough to see the shape of the customization APIs.
- By the end you will have a working Strapi project serving a GraphQL schema at `http://localhost:1337/graphql`, with an Apollo Sandbox for testing, and a mental model of Shadow CRUD that prepares you for the in-depth customization tutorial.
- Target audience: developers comfortable with Node and TypeScript who have not used Strapi before, or who have used Strapi's REST API but not its GraphQL plugin.
- No frontend code. No authentication. No database beyond SQLite. The goal is understanding the backend surface first; a frontend tutorial and an auth tutorial are linked at the end.

## Why this post exists

Strapi is a headless CMS. Install the GraphQL plugin and it generates a full GraphQL schema from whatever content types you have defined, with no additional code. The feature is called **Shadow CRUD**, and it is the foundation everything else in the Strapi GraphQL ecosystem builds on.

Before reading a deep-dive on custom resolvers, middlewares, policies, and computed fields, it helps to have hands-on experience with what Shadow CRUD gives you for free. This post is that experience. It produces a minimal but complete Strapi + GraphQL project, demonstrates every CRUD operation against it, and introduces the three most common customizations so the advanced material feels familiar.

If you already have a running Strapi v5 project with the GraphQL plugin installed and you know what `createPost(data: PostInput!)` means, skip this and go read the advanced tutorial.

## Prerequisites

- Node.js 20 or newer (Strapi v5 supports up to 24.x)
- A terminal and a code editor
- Basic TypeScript familiarity

You do not need prior Strapi experience.

## Step 1: Create a new Strapi project

In an empty directory, run the Strapi scaffold command:

```bash
npx create-strapi@latest strapi-graphql-starter
```

The CLI will ask a series of questions. Reasonable answers for this tutorial:

| Prompt | Answer |
|---|---|
| "Do you want to use the default database (SQLite)?" | Yes |
| "Start with an example structure & data?" | No |
| "Use TypeScript?" | Yes |
| "Install dependencies with npm?" | Yes |
| "Would you like to initialize a git repository?" | Yes |
| "Would you like to log in?" | Skip for now |

The installer takes a few minutes. When it finishes, move into the project directory:

```bash
cd strapi-graphql-starter
```

## Step 2: Run Strapi and create an admin user

Start the development server:

```bash
npm run develop
```

Strapi compiles the project, migrates the SQLite database, and prints a banner when it is ready. It serves two things at `http://localhost:1337`:

- `/admin` — the admin UI for editing content types and entries
- `/api` — the REST API (we will not use this)

Open `http://localhost:1337/admin` in a browser. Fill in the one-time registration form to create your first admin user. This account only exists locally and is not connected to any Strapi cloud service.

## Step 3: Install the GraphQL plugin

Stop the dev server with Ctrl+C, then install the GraphQL plugin:

```bash
npm install @strapi/plugin-graphql
```

Strapi picks up the plugin at boot; no configuration file edit is required. Start the server again:

```bash
npm run develop
```

Open `http://localhost:1337/graphql` in a browser. You should see the **Apollo Sandbox** — an interactive UI for writing GraphQL queries against your Strapi server. Leave the tab open; every query and mutation in this post is run here.

At this point the schema is empty apart from a few internal queries. We need a content type to generate anything interesting.

## Step 4: Create a Post content type

In the admin UI, click **Content-Type Builder** in the left sidebar. Click **Create new collection type** and name it `Post` (singular). Strapi will suggest `posts` as the plural.

Add these fields:

- **Text** field, name `title`, short text, required
- **Rich text (Markdown)** field, name `body`
- **Boolean** field, name `featured`, default value `false`

Click **Save**. Strapi will restart automatically to regenerate types and API files.

Behind the scenes this creates `src/api/post/content-types/post/schema.json` with roughly this content:

```json
{
  "kind": "collectionType",
  "collectionName": "posts",
  "info": {
    "singularName": "post",
    "pluralName": "posts",
    "displayName": "Post"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "body":  { "type": "richtext" },
    "featured": { "type": "boolean", "default": false }
  }
}
```

As soon as Strapi restarts, the GraphQL plugin generates a full set of queries, mutations, and input types for `Post`. The Sandbox's Schema panel will show them.

## Step 5: Grant public permissions

By default, every API is locked down. To let the Apollo Sandbox query posts without authentication, grant the public role read and write access:

1. In the admin UI, open **Settings**.
2. Under **Users & Permissions Plugin**, click **Roles**.
3. Click **Public**.
4. Expand **Post** and check `find`, `findOne`, `create`, `update`, and `delete`.
5. Click **Save**.

This is only for development. Real deployments use API tokens or the `users-permissions` login flow.

## Step 6: Create a few sample posts

Still in the admin, click **Content Manager** → **Post** → **Create new entry**. Create three or four posts with different titles and bodies. Mark one of them as `featured: true`. Click **Publish** on each so they become visible to public queries (draft entries are hidden by default).

## Step 7: Explore the auto-generated queries

Switch to the Apollo Sandbox at `http://localhost:1337/graphql`. The queries below are ready to paste into the **Operation** editor.

### List all published posts

```graphql
query Posts {
  posts {
    documentId
    title
    featured
    publishedAt
  }
}
```

This returns every published Post. The `documentId` is Strapi v5's stable identifier for an entry; use it anywhere you need to refer to a specific post.

### Filter posts

```graphql
query FeaturedPosts {
  posts(filters: { featured: { eq: true } }) {
    documentId
    title
  }
}
```

`filters` is a generated input type with one field per attribute. Each attribute accepts operators like `eq`, `ne`, `contains`, `containsi`, `startsWith`, `lt`, `gt`, `in`, and combinators `and` / `or` / `not`.

### Sort and paginate

```graphql
query PagedPosts {
  posts(
    sort: "title:asc"
    pagination: { page: 1, pageSize: 10 }
  ) {
    documentId
    title
  }
}
```

`sort` takes a single string or an array of strings of the form `field:asc` / `field:desc`. `pagination` accepts either `{ page, pageSize }` or `{ start, limit }`.

### Fetch a single post

Grab a `documentId` from any of the responses above and paste it into the **Variables** tab:

```graphql
query Post($documentId: ID!) {
  post(documentId: $documentId) {
    documentId
    title
    body
    featured
  }
}
```

Variables:

```json
{ "documentId": "paste-a-real-documentId-here" }
```

That is the entire Shadow CRUD read surface: list, filter, sort, paginate, and fetch-by-id, all generated from one content type.

## Step 8: Explore the auto-generated mutations

### Create a post

```graphql
mutation CreatePost($data: PostInput!) {
  createPost(data: $data) {
    documentId
    title
  }
}
```

Variables:

```json
{
  "data": {
    "title": "Hello from Apollo Sandbox",
    "body": "This post was created via GraphQL.",
    "featured": false
  }
}
```

The `PostInput` type was generated from the content type. Every non-relation attribute is available; required fields must be provided.

### Update a post

```graphql
mutation UpdatePost($documentId: ID!, $data: PostInput!) {
  updatePost(documentId: $documentId, data: $data) {
    documentId
    title
  }
}
```

Variables:

```json
{
  "documentId": "paste-a-real-documentId-here",
  "data": { "title": "Edited title" }
}
```

### Delete a post

```graphql
mutation DeletePost($documentId: ID!) {
  deletePost(documentId: $documentId) {
    documentId
  }
}
```

Variables:

```json
{ "documentId": "paste-a-real-documentId-here" }
```

At this point the schema is complete for standard CRUD. You can build a reasonable blog reader on top of this with no further server-side work.

## Step 9: First customization — plugin limits

Before writing any custom code, add two configuration values that every production Strapi + GraphQL setup should have. Create or edit `config/plugins.ts`:

```typescript
// config/plugins.ts
import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  graphql: {
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      depthLimit: 10,
      amountLimit: 100,
      landingPage: env('NODE_ENV') !== 'production',
      apolloServer: {
        introspection: env('NODE_ENV') !== 'production',
      },
    },
  },
});

export default config;
```

- `depthLimit` caps how deeply a query can nest. Without it, a query like `posts { tags { posts { tags { ... } } } }` can exhaust the database.
- `amountLimit` caps how many entries any single resolver returns.
- `landingPage` controls whether the Apollo Sandbox is served at `/graphql`. Keep it on in development; turn it off in production so the schema is not handed to anyone with a browser.
- `apolloServer.introspection` controls whether the schema can be introspected. Same reasoning as `landingPage`.

Restart the dev server to pick up the change. The Sandbox still works in development, but a production deployment would no longer expose it.

## Step 10: First customization — a computed field

Computed fields are fields that do not exist in the database but are derived at query time. They are the simplest introduction to the GraphQL plugin's extension API.

The plugin's extension service is obtained inside Strapi's `register()` lifecycle hook. Edit `src/index.ts`:

```typescript
// src/index.ts
import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');

    extensionService.use(({ nexus }: any) => ({
      types: [
        nexus.extendType({
          type: 'Post',
          definition(t) {
            t.nonNull.int('wordCount', {
              resolve(parent: { body?: string | null }) {
                const text = (parent?.body ?? '').trim();
                return text ? text.split(/\s+/).length : 0;
              },
            });
          },
        }),
      ],
      resolversConfig: {
        'Post.wordCount': { auth: false },
      },
    }));
  },

  bootstrap() {},
};
```

Two things are happening:

- `nexus.extendType({ type: 'Post', definition })` appends a new field to the auto-generated `Post` type without replacing or wrapping it. The plugin passes a `nexus` reference into the factory so your extension composes with the generated types.
- The `resolve(parent, args, context)` callback receives the Post row and returns whatever the declared field type requires. Here it splits the body on whitespace and returns an integer.

Restart the dev server. In the Sandbox, the `Post` type should now show a `wordCount: Int!` field, and this query should return word counts for every post:

```graphql
query PostsWithWordCount {
  posts {
    title
    wordCount
  }
}
```

## Step 11: First customization — a custom query

The same pattern extends `Query` to define brand-new top-level queries. A small example: return only posts whose title contains a substring.

Extend the existing `extensionService.use(...)` call by adding a second entry to the `types` array:

```typescript
extensionService.use(({ nexus }: any) => ({
  types: [
    nexus.extendType({
      type: 'Post',
      definition(t) {
        t.nonNull.int('wordCount', {
          resolve(parent: { body?: string | null }) {
            const text = (parent?.body ?? '').trim();
            return text ? text.split(/\s+/).length : 0;
          },
        });
      },
    }),
    nexus.extendType({
      type: 'Query',
      definition(t) {
        t.list.field('searchPosts', {
          type: nexus.nonNull('Post'),
          args: { q: nexus.nonNull(nexus.stringArg()) },
          async resolve(_parent: unknown, args: { q: string }) {
            return strapi.documents('api::post.post').findMany({
              filters: { title: { $containsi: args.q } },
              sort: ['publishedAt:desc'],
            });
          },
        });
      },
    }),
  ],
  resolversConfig: {
    'Post.wordCount': { auth: false },
    'Query.searchPosts': { auth: false },
  },
}));
```

Key points:

- `nexus.extendType({ type: 'Query', ... })` adds a field to the top-level `Query` type. That field becomes a new top-level GraphQL query: `searchPosts(q: String!): [Post!]`.
- The resolver calls `strapi.documents('api::post.post').findMany(...)` — the Document Service API, Strapi v5's recommended way to read and write content entries.
- `$containsi` is a case-insensitive substring filter. The full set of operators matches those available to Shadow CRUD filters.
- `resolversConfig` with `auth: false` tells the plugin this query can run without authentication. Without it, the Users & Permissions plugin would reject the anonymous request.

Restart. In the Sandbox:

```graphql
query SearchPosts($q: String!) {
  searchPosts(q: $q) {
    documentId
    title
    wordCount
  }
}
```

Variables:

```json
{ "q": "hello" }
```

Every Post whose title contains "hello" (case-insensitive) should come back, with their word counts.

## What you just built

- A Strapi v5 project with the GraphQL plugin installed.
- One content type (`Post`) with a complete Shadow CRUD surface: list, filter, sort, paginate, create, update, delete.
- Three customizations: plugin limits, a computed field on `Post`, and a custom top-level query.

That is enough to understand the shape of Strapi's GraphQL customization APIs: the extension service, the `nexus.extendType` pattern, and the fact that resolvers are plain async functions with access to the Strapi instance.

## What's next

The advanced tutorial, *Strapi v5 GraphQL Customization — Note-Taking Demo*, builds on this foundation with:

- **`resolversConfig` middlewares and policies** — logging, cache hints, and conditional authorization attached to any resolver.
- **Selectively disabling Shadow CRUD** — hiding fields, disabling filters, removing mutations from the schema entirely.
- **Custom object types** — returning aggregate shapes (like a stats object) that do not correspond to a content type.
- **Multiple custom queries and mutations** — including raw SQL aggregations via `strapi.db.connection.raw`.
- **Consuming the schema from Next.js 16 App Router** with Apollo Client and Server Actions.

If you want to extend the project to multi-user with authentication, a follow-up post covers the users-permissions plugin, cookie-stored JWTs, and per-user ownership enforcement via resolver middlewares and policies.

**Citations**

- Strapi — GraphQL plugin: https://docs.strapi.io/cms/plugins/graphql
- Strapi — Document Service API: https://docs.strapi.io/cms/api/document-service
- Strapi — Content-Type Builder: https://docs.strapi.io/cms/features/content-type-builder
- Nexus schema documentation: https://nexusjs.org/
