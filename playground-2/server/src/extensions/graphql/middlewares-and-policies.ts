import type { GraphQLResolveInfo } from "graphql";
import { errors } from "@strapi/utils";

type NotesArgs = {
  filters?: Record<string, unknown>;
  pagination?: Record<string, unknown>;
  sort?: string | string[];
};

type NoteArgs = {
  documentId?: string;
};

type ResolverNext<A> = (
  parent: unknown,
  args: A,
  context: unknown,
  info: GraphQLResolveInfo,
) => Promise<unknown>;

export default function middlewaresAndPolicies() {
  return {
    resolversConfig: {
      "Query.notes": {
        middlewares: [
          async (
            next: ResolverNext<NotesArgs>,
            parent: unknown,
            args: NotesArgs,
            context: unknown,
            info: GraphQLResolveInfo,
          ) => {
            if (args?.filters?.archived !== undefined) {
              throw new errors.ForbiddenError(
                "Cannot filter on `archived` directly. Soft-deleted notes are not accessible via the public API.",
              );
            }
            return next(parent, args, context, info);
          },
          async (
            next: ResolverNext<NotesArgs>,
            parent: unknown,
            args: NotesArgs,
            context: unknown,
            info: GraphQLResolveInfo,
          ) => {
            args.filters = {
              ...(args?.filters ?? {}),
              archived: { eq: false },
            };
            return next(parent, args, context, info);
          },
          async (
            next: ResolverNext<NotesArgs>,
            parent: unknown,
            args: NotesArgs,
            context: unknown,
            info: GraphQLResolveInfo,
          ) => {
            const label = `[graphql] Query.notes (${JSON.stringify(args?.filters ?? {})})`;
            console.time(label);
            try {
              return await next(parent, args, context, info);
            } finally {
              console.timeEnd(label);
            }
          },
        ],
        policies: ["global::cap-page-size"],
      },
      "Query.note": {
        middlewares: [
          async (
            next: ResolverNext<NoteArgs>,
            parent: unknown,
            args: NoteArgs,
            context: unknown,
            info: GraphQLResolveInfo,
          ) => {
            const result = (await next(parent, args, context, info)) as
              | { archived?: boolean }
              | null
              | undefined;
            if (result && result.archived === true) {
              throw new errors.NotFoundError("Note not found.");
            }
            return result;
          },
        ],
      },
    },
  };
}
