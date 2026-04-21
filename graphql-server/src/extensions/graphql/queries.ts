import type { Core } from '@strapi/strapi';

export default function queries({
  nexus,
  strapi,
}: {
  nexus: typeof import('nexus');
  strapi: Core.Strapi;
}) {
  return {
  types: [
    nexus.objectType({
      name: 'TagCount',
      definition(t) {
        t.nonNull.string('slug');
        t.nonNull.string('name');
        t.nonNull.int('count');
      },
    }),

    nexus.objectType({
      name: 'NoteStats',
      definition(t) {
        t.nonNull.int('total');
        t.nonNull.int('pinned');
        t.nonNull.int('archived');
        t.nonNull.list.nonNull.field('byTag', { type: 'TagCount' });
      },
    }),

    nexus.extendType({
      type: 'Query',
      definition(t) {
        t.list.field('searchNotes', {
          type: nexus.nonNull('Note'),
          args: {
            query: nexus.nonNull(nexus.stringArg()),
            includeArchived: nexus.booleanArg({ default: false }),
          },
          async resolve(_parent, args) {
            const { query, includeArchived } = args as {
              query: string;
              includeArchived: boolean;
            };
            const where: any = {
              title: { $containsi: query },
            };
            if (!includeArchived) where.archived = false;
            return strapi.documents('api::note.note').findMany({
              filters: where,
              populate: ['tags'],
              sort: ['pinned:desc', 'updatedAt:desc'],
            });
          },
        });

        t.nonNull.field('noteStats', {
          type: 'NoteStats',
          async resolve() {
            const [total, pinned, archived] = await Promise.all([
              strapi.db.query('api::note.note').count(),
              strapi.db.query('api::note.note').count({ where: { pinned: true } }),
              strapi.db.query('api::note.note').count({ where: { archived: true } }),
            ]);

            const rows = (await strapi.db.connection.raw(
              `
                SELECT tags.slug as slug, tags.name as name, COUNT(link.note_id) as count
                FROM tags
                LEFT JOIN notes_tags_lnk link ON link.tag_id = tags.id
                GROUP BY tags.id
                ORDER BY count DESC, tags.name ASC
              `,
            )) as Array<{ slug: string; name: string; count: number }>;

            const byTag = (Array.isArray(rows) ? rows : []).map((r) => ({
              slug: r.slug,
              name: r.name,
              count: Number(r.count ?? 0),
            }));

            return { total, pinned, archived, byTag };
          },
        });

        t.list.field('notesByTag', {
          type: nexus.nonNull('Note'),
          args: {
            slug: nexus.nonNull(nexus.stringArg()),
          },
          async resolve(_parent, args) {
            const { slug } = args as { slug: string };
            return strapi.documents('api::note.note').findMany({
              filters: {
                archived: false,
                tags: { slug: { $eq: slug } },
              },
              populate: ['tags'],
              sort: ['pinned:desc', 'updatedAt:desc'],
            });
          },
        });
      },
    }),
  ],
  resolversConfig: {
    'Query.searchNotes': { auth: false },
    'Query.noteStats': { auth: false },
    'Query.notesByTag': { auth: false },
  },
  };
}
