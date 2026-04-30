import type { Core } from "@strapi/strapi";
import registerGraphQLExtensions from "./extensions/graphql";

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerGraphQLExtensions(strapi);

    // From Step 3: stamp `owner` on every new note.
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

    // NEW: scope every Note read to the signed-in user.
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
        // -1 is never a valid User id, so the query returns zero rows
        // instead of falling through to "return everything."
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
  },

  bootstrap() {
    // Bootstrap intentionally empty.
  },
};