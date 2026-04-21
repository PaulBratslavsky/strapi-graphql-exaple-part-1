import { HttpLink } from '@apollo/client';
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';

const STRAPI_GRAPHQL_URL =
  process.env.STRAPI_GRAPHQL_URL ?? 'http://localhost:1338/graphql';

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Note: { keyFields: ['documentId'] },
        Tag: { keyFields: ['documentId'] },
      },
    }),
    link: new HttpLink({
      uri: STRAPI_GRAPHQL_URL,
      fetchOptions: { cache: 'no-store' },
    }),
  });
});
