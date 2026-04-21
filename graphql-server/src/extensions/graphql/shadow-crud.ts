import type { Core } from '@strapi/strapi';

export default function configureShadowCRUD(strapi: Core.Strapi) {
  const extension = strapi.plugin('graphql').service('extension');

  extension.shadowCRUD('api::note.note').disableAction('delete');

  extension
    .shadowCRUD('api::note.note')
    .field('internalNotes')
    .disableOutput();

  extension
    .shadowCRUD('api::note.note')
    .field('internalNotes')
    .disableFilters();
}
