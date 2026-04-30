"use strict";

async function main() {
  const { createStrapi, compileStrapi } = require("@strapi/strapi");
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = "error";

  const testuser = await strapi
    .documents("plugin::users-permissions.user")
    .findFirst({ filters: { username: "testuser" } });
  if (!testuser) {
    throw new Error('No user with username "testuser". Register one first.');
  }

  const notes = await strapi
    .documents("api::note.note")
    .findMany({ pagination: { pageSize: 100 } });

  for (const note of notes) {
    await strapi.documents("api::note.note").update({
      documentId: note.documentId,
      data: { owner: testuser.id },
    });
  }

  console.log(
    `Backfilled ${notes.length} notes to owner ${testuser.username}.`,
  );

  await app.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});