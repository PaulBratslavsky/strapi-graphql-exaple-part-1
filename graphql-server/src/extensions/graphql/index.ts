import type { Core } from '@strapi/strapi';
import middlewaresAndPolicies from './middlewares-and-policies';
import computedFields from './computed-fields';
import queries from './queries';
import mutations from './mutations';
import configureShadowCRUD from './shadow-crud';

export default function registerGraphQLExtensions(strapi: Core.Strapi) {
  const extensionService = strapi.plugin('graphql').service('extension');

  configureShadowCRUD(strapi);

  extensionService.use(middlewaresAndPolicies);
  extensionService.use(computedFields);
  extensionService.use(function extendQueries({ nexus }: any) {
    return queries({ nexus, strapi });
  });
  extensionService.use(function extendMutations({ nexus }: any) {
    return mutations({ nexus, strapi });
  });
}
