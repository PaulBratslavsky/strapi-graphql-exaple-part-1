import type { Core } from "@strapi/strapi";
import { errors } from "@strapi/utils";
import registerGraphQLExtensions from "./extensions/graphql";

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerGraphQLExtensions(strapi);

    // Stamp the authenticated user as `owner` on every new Note. Runs at
    // the Document Service layer, so it applies to REST, GraphQL, custom
    // resolvers, and seed scripts uniformly.
    strapi.documents.use(async (context, next) => {
      if (context.uid !== "api::note.note") return next();
      if (context.action !== "create") return next();

      const requestCtx = strapi.requestContext.get();
      const user = requestCtx?.state?.user;
      if (user?.id) {
        context.params.data = {
          ...(context.params.data ?? {}),
          owner: user.id,
        } as typeof context.params.data;
      }

      return next();
    });

    // Scope every Note read to the signed-in user.
    strapi.documents.use(async (context, next) => {
      if (context.uid !== "api::note.note") return next();
      if (context.action !== "findMany" && context.action !== "findOne") {
        return next();
      }

      const requestCtx = strapi.requestContext.get();
      const user = requestCtx?.state?.user;
      const existingFilters = (context.params.filters ?? {}) as Record<
        string,
        unknown
      >;

      if (!user?.id) {
        // No signed-in user: force the filter to match nothing.
        // Use the nested filter shape Strapi's typings expect; -1 is never
        // a valid User id, so the query returns zero rows instead of falling
        // through to "return everything."
        context.params.filters = {
          ...existingFilters,
          owner: { id: { $eq: -1 } },
        } as typeof context.params.filters;
        return next();
      }

      context.params.filters = {
        ...existingFilters,
        owner: { id: { $eq: user.id } },
      } as typeof context.params.filters;
      return next();
    });

    // Scope every Note write (update, delete) to the signed-in owner.
    // Pre-flight findOne reuses the read-scoping clause above, so a
    // non-owner sees null for the lookup and we throw NotFoundError to
    // match the read security posture (no existence leak via 403).
    strapi.documents.use(async (context, next) => {
      if (context.uid !== "api::note.note") return next();
      if (context.action !== "update" && context.action !== "delete") {
        return next();
      }

      const documentId = (context.params as { documentId?: string })
        .documentId;
      if (!documentId) return next();

      const existing = await strapi
        .documents("api::note.note")
        .findOne({ documentId });
      if (!existing) {
        throw new errors.NotFoundError("Note not found.");
      }

      return next();
    });
  },

  bootstrap() {},
};
