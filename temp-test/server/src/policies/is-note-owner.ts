// server/src/policies/is-note-owner.ts
import type { Core } from "@strapi/strapi";

type PolicyContext = {
  args?: { documentId?: string };
  state?: { user?: { id?: number | string } };
  context?: { state?: { user?: { id?: number | string } } };
};

const isNoteOwner = async (
  policyContext: PolicyContext,
  _config: unknown,
  { strapi }: { strapi: Core.Strapi },
): Promise<boolean> => {
  const user =
    policyContext?.state?.user ?? policyContext?.context?.state?.user;
  if (!user?.id) {
    strapi.log.warn("is-note-owner: rejected, no authenticated user.");
    return false;
  }

  const documentId = policyContext?.args?.documentId;
  if (!documentId) {
    strapi.log.warn("is-note-owner: rejected, no documentId in args.");
    return false;
  }

  const note = await strapi
    .documents("api::note.note")
    .findOne({ documentId, populate: ["owner"] });

  if (!note) return false;
  if (note.owner?.id === user.id) return true;

  strapi.log.warn(
    `is-note-owner: rejected, user ${user.id} is not the owner of note ${documentId}.`,
  );
  return false;
};

export default isNoteOwner;