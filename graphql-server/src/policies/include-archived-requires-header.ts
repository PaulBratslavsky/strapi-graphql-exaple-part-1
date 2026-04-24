import type { Core } from "@strapi/strapi";

type ArchivedFilter = boolean | { eq?: boolean; $eq?: boolean };

type PolicyContext = {
  args?: { filters?: { archived?: ArchivedFilter } };
  context?: {
    http?: {
      request: { headers: Record<string, string | string[] | undefined> };
    };
  };
  http?: {
    request: { headers: Record<string, string | string[] | undefined> };
  };
};

const includeArchivedRequiresHeader = (
  policyContext: PolicyContext,
  _config: unknown,
  { strapi }: { strapi: Core.Strapi },
): boolean => {
  const filter = policyContext?.args?.filters?.archived;
  const wantsArchived =
    filter === true ||
    (typeof filter === "object" &&
      (filter?.eq === true || filter?.$eq === true));

  if (!wantsArchived) return true;

  const headers =
    policyContext?.context?.http?.request?.headers ??
    policyContext?.http?.request?.headers;
  const header = headers?.["x-include-archived"];

  if (header === "yes") return true;
  strapi.log.warn(
    "Query.notes with archived filter blocked, missing x-include-archived header.",
  );
  return false;
};

export default includeArchivedRequiresHeader;
