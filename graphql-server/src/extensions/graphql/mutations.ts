import type { Core } from '@strapi/strapi';

export default function mutations({
  nexus,
  strapi,
}: {
  nexus: typeof import('nexus');
  strapi: Core.Strapi;
}) {
  return {
  types: [
    nexus.extendType({
      type: 'Mutation',
      definition(t) {
        t.field('togglePin', {
          type: 'Note',
          args: {
            documentId: nexus.nonNull(nexus.idArg()),
          },
          async resolve(_parent, args) {
            const { documentId } = args as { documentId: string };
            const current = await strapi
              .documents('api::note.note')
              .findOne({ documentId });
            if (!current) {
              throw new Error(`Note ${documentId} not found`);
            }
            return strapi.documents('api::note.note').update({
              documentId,
              data: { pinned: !current.pinned },
              populate: ['tags'],
            });
          },
        });

        t.field('archiveNote', {
          type: 'Note',
          args: {
            documentId: nexus.nonNull(nexus.idArg()),
          },
          async resolve(_parent, args) {
            const { documentId } = args as { documentId: string };
            return strapi.documents('api::note.note').update({
              documentId,
              data: { archived: true, pinned: false },
              populate: ['tags'],
            });
          },
        });

        t.field('duplicateNote', {
          type: 'Note',
          args: {
            documentId: nexus.nonNull(nexus.idArg()),
          },
          async resolve(_parent, args) {
            const { documentId } = args as { documentId: string };
            const original = await strapi
              .documents('api::note.note')
              .findOne({ documentId, populate: ['tags'] });
            if (!original) {
              throw new Error(`Note ${documentId} not found`);
            }
            const tagIds = Array.isArray(original.tags)
              ? original.tags.map((tag: any) => tag.documentId).filter(Boolean)
              : [];
            return strapi.documents('api::note.note').create({
              data: {
                title: `${original.title} (copy)`,
                content: original.content as any,
                pinned: false,
                archived: false,
                tags: tagIds,
              },
              populate: ['tags'],
            });
          },
        });
      },
    }),
  ],
  resolversConfig: {
    'Mutation.togglePin': { auth: false },
    'Mutation.archiveNote': { auth: false },
    'Mutation.duplicateNote': { auth: false },
  },
  };
}
