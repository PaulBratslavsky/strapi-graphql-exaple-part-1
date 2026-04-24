import type { Core } from "@strapi/strapi";
import computedFields from "./computed-fields";
import queries from "./queries";
import mutations from "./mutations";
import middlewaresAndPolicies from "./middlewares-and-policies";

export default function registerGraphQLExtensions(strapi: Core.Strapi) {
  const extensionService = strapi.plugin("graphql").service("extension");

  extensionService.use(middlewaresAndPolicies);
  extensionService.use(computedFields);
  extensionService.use(function extendQueries({ nexus }: any) {
    return queries({ nexus, strapi });
  });
  extensionService.use(function extendMutations({ nexus }: any) {
    return mutations({ nexus, strapi });
  });
}