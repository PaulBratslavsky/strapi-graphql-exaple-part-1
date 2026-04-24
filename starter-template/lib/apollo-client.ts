// Apollo Client for React Server Components — NOT YET CONFIGURED.
//
// Part 3 Step 2 walks through building this file. Until you complete that
// step, every page in the starter reads from `lib/placeholder.ts` instead.
//
// When you are ready, replace the contents of this file with:
//
//   import { HttpLink } from "@apollo/client";
//   import {
//     registerApolloClient,
//     ApolloClient,
//     InMemoryCache,
//   } from "@apollo/client-integration-nextjs";
//
//   const STRAPI_GRAPHQL_URL =
//     process.env.STRAPI_GRAPHQL_URL ?? "http://localhost:1338/graphql";
//
//   export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
//     return new ApolloClient({
//       cache: new InMemoryCache({
//         typePolicies: {
//           Note: { keyFields: ["documentId"] },
//           Tag: { keyFields: ["documentId"] },
//         },
//       }),
//       link: new HttpLink({
//         uri: STRAPI_GRAPHQL_URL,
//         fetchOptions: { cache: "no-store" },
//       }),
//     });
//   });
//
// Forward-compatibility note for Part 4:
//
// Part 4 adds authentication. It augments the HttpLink above with a custom
// `fetch` wrapper that reads the JWT via `getJwt()` from `lib/auth.ts` and
// injects an `Authorization: Bearer <token>` header when present. The shape
// Part 4 ends up with is roughly:
//
//   import { getJwt } from "@/lib/auth";
//   link: new HttpLink({
//     uri: STRAPI_GRAPHQL_URL,
//     fetch: async (url, init) => {
//       const token = await getJwt();
//       return fetch(url, {
//         ...init,
//         headers: {
//           ...(init?.headers as Record<string, string>),
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         cache: "no-store",
//       });
//     },
//   }),
//
// You do not need to do this in Part 3. Mentioned only so Part 4's diff is
// targeted rather than a rewrite of this file.

export {};
