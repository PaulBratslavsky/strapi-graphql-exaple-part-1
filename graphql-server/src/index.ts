import type { Core } from '@strapi/strapi';
import registerGraphQLExtensions from './extensions/graphql';

const PUBLIC_ACTIONS: Record<string, string[]> = {
  'api::note.note': ['find', 'findOne', 'create', 'update', 'delete'],
  'api::tag.tag': ['find', 'findOne', 'create', 'update', 'delete'],
};

async function grantPublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) return;

  for (const [uid, actions] of Object.entries(PUBLIC_ACTIONS)) {
    for (const action of actions) {
      const actionId = `${uid}.${action}`;
      const existing = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action: actionId, role: publicRole.id } });

      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { action: actionId, role: publicRole.id },
        });
      }
    }
  }
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerGraphQLExtensions(strapi);
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicPermissions(strapi);
  },
};
