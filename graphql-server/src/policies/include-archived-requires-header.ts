import type { Core } from '@strapi/strapi';

type PolicyContext = {
  args?: { filters?: { archived?: { eq?: boolean; $eq?: boolean } | boolean } };
  context?: any;
  http?: any;
};

const policy = (policyContext: PolicyContext, _config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  const filter = policyContext?.args?.filters?.archived;
  const wantsArchived =
    filter === true ||
    (typeof filter === 'object' && (filter?.eq === true || filter?.$eq === true));

  if (!wantsArchived) return true;

  const koa =
    policyContext?.context?.http ??
    policyContext?.http ??
    policyContext?.context;
  const header =
    koa?.request?.header?.['x-include-archived'] ??
    koa?.request?.headers?.['x-include-archived'] ??
    koa?.headers?.['x-include-archived'];

  if (header === 'yes') return true;

  strapi.log.warn(
    'Query.notes with archived filter blocked — missing x-include-archived header.',
  );
  return false;
};

export default policy;
