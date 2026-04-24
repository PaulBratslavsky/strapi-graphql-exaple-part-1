import type { Core } from "@strapi/strapi";

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  graphql: {
    config: {
      endpoint: "/graphql",
      shadowCRUD: true,
      depthLimit: 10,
      defaultLimit: 25,
      maxLimit: 100,
      landingPage: env("NODE_ENV") !== "production",
      apolloServer: {
        introspection: env("NODE_ENV") !== "production",
      },
    },
  },
});

export default config;