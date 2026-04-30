import type { Core } from "@strapi/strapi";

const MAX_PAGE_SIZE = 100;

type Pagination = {
  pageSize?: number | string;
  limit?: number | string;
};

type PolicyContext = {
  args?: { pagination?: Pagination };
};

const capPageSize = (
  policyContext: PolicyContext,
  _config: unknown,
  { strapi }: { strapi: Core.Strapi },
): boolean => {
  const pagination = policyContext?.args?.pagination ?? {};
  const requested = Number(pagination.pageSize ?? pagination.limit ?? 0);

  if (Number.isFinite(requested) && requested > MAX_PAGE_SIZE) {
    strapi.log.warn(
      `Query.notes blocked: pageSize ${requested} exceeds cap of ${MAX_PAGE_SIZE}.`,
    );
    return false;
  }

  return true;
};

export default capPageSize;
