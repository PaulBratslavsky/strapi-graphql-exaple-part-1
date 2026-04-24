import type { GraphQLResolveInfo } from "graphql";

type NotesArgs = {
  filters?: Record<string, unknown>;
  pagination?: Record<string, unknown>;
  sort?: string | string[];
};

type ResolverNext = (
  parent: unknown,
  args: NotesArgs,
  context: unknown,
  info: GraphQLResolveInfo,
) => Promise<unknown>;

export default function middlewaresAndPolicies() {
  return {
    resolversConfig: {
      "Query.notes": {
        middlewares: [
          async (
            next: ResolverNext,
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
        policies: ["global::include-archived-requires-header"],
      },
    },
  };
}