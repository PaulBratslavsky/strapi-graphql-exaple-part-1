# Strapi v5 GraphQL Customization — Note-Taking Demo

Companion monorepo for the tutorial post walking through Strapi v5 GraphQL from auto-generated Shadow CRUD through custom Nexus resolvers and mutations.

## Layout

```
graphql-customization/
├── graphql-server/   # Strapi 5 backend with custom GraphQL extensions
└── frontend/         # Next.js 16 App Router frontend (Apollo + Tailwind + shadcn)
```

Each subproject owns its own `node_modules`. The root only provides `concurrently` to run both dev servers together.

## First-time setup

```bash
npm install            # installs concurrently
npm run install:all    # installs graphql-server + frontend deps
npm run seed           # populates 5 tags + 10 notes
```

## Run both in dev

```bash
npm run dev            # Strapi on :1338, Next.js on :3001
```

Individual:

```bash
npm run dev:server     # Strapi → http://localhost:1338/graphql
npm run dev:frontend   # Next   → http://localhost:3001
```

## What the tutorial covers

1. Installing `@strapi/plugin-graphql` and configuring depth/amount limits
2. Shadow CRUD — free queries, mutations, filters, sorting, pagination
3. `resolversConfig` — adding middlewares and policies to auto-generated resolvers
4. Selectively disabling shadow CRUD (mutations, fields, filters)
5. Extending existing types with computed fields (`wordCount`, `readingTime`, `excerpt`)
6. Custom Nexus queries (`searchNotes`, `noteStats`, `notesByTag`)
7. Custom Nexus mutations (`togglePin`, `archiveNote`, `duplicateNote`)
8. Consuming the schema from Next.js App Router with Apollo + Server Actions
# strapi-graphql-exaple-part-1
