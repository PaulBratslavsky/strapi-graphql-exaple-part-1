import type { Core } from "@strapi/strapi";

export default function queries({
  nexus,
  strapi,
}: {
  nexus: typeof import("nexus");
  strapi: Core.Strapi;
}) {
  return {
    types: [
      nexus.objectType({
        name: "TagCount",
        definition(t) {
          t.nonNull.string("slug");
          t.nonNull.string("name");
          t.nonNull.int("count");
        },
      }),
      nexus.objectType({
        name: "NoteStats",
        definition(t) {
          t.nonNull.int("total");
          t.nonNull.int("pinned");
          t.nonNull.int("archived");
          t.nonNull.list.nonNull.field("byTag", { type: "TagCount" });
        },
      }),
      nexus.extendType({
        type: "Query",
        definition(t) {
          t.list.field("searchArticles", {
            type: nexus.nonNull("Article"),
            args: { q: nexus.nonNull(nexus.stringArg()) },
            async resolve(_parent: unknown, args: { q: string }) {
              return strapi.documents("api::article.article").findMany({
                filters: { title: { $containsi: args.q } },
                sort: ["publishedAt:desc"],
                status: "published",
              });
            },
          });

          t.list.field("searchNotes", {
            type: nexus.nonNull("Note"),
            args: {
              query: nexus.nonNull(nexus.stringArg()),
              includeArchived: nexus.booleanArg({ default: false }),
            },
            async resolve(
              _parent: unknown,
              { query, includeArchived }: { query: string; includeArchived: boolean },
            ) {
              const where: any = { title: { $containsi: query } };
              if (!includeArchived) where.archived = false;
              return strapi.documents("api::note.note").findMany({
                filters: where,
                populate: ["tags"],
                sort: ["pinned:desc", "updatedAt:desc"],
              });
            },
          });

          t.nonNull.field("noteStats", {
            type: "NoteStats",
            async resolve() {
              const [total, pinned, archived, tags] = await Promise.all([
                strapi.documents("api::note.note").count({}),
                strapi.documents("api::note.note").count({
                  filters: { pinned: true },
                }),
                strapi.documents("api::note.note").count({
                  filters: { archived: true },
                }),
                strapi.documents("api::tag.tag").findMany({
                  populate: ["notes"],
                  sort: ["name:asc"],
                }),
              ]);

              const byTag = tags
                .map((tag: any) => ({
                  slug: tag.slug,
                  name: tag.name,
                  count: Array.isArray(tag.notes) ? tag.notes.length : 0,
                }))
                .sort(
                  (a, b) => b.count - a.count || a.name.localeCompare(b.name),
                );

              return { total, pinned, archived, byTag };
            },
          });

          t.list.field("notesByTag", {
            type: nexus.nonNull("Note"),
            args: { slug: nexus.nonNull(nexus.stringArg()) },
            async resolve(_parent: unknown, { slug }: { slug: string }) {
              return strapi.documents("api::note.note").findMany({
                filters: { archived: false, tags: { slug: { $eq: slug } } },
                populate: ["tags"],
                sort: ["pinned:desc", "updatedAt:desc"],
              });
            },
          });
        },
      }),
    ],
    resolversConfig: {
      "Query.searchArticles": { auth: false },
      "Query.searchNotes": { auth: false },
      "Query.noteStats": { auth: false },
      "Query.notesByTag": { auth: false },
    },
  };
}
