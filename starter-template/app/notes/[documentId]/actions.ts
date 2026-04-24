"use server";

// TODO (Part 3 Step 5): wire these Server Actions to the custom mutations
// from Part 2 Step 10 (togglePin, archiveNote).
//
//   import { revalidatePath } from "next/cache";
//   import { redirect } from "next/navigation";
//   import { getClient } from "@/lib/apollo-client";
//   import { TOGGLE_PIN, ARCHIVE_NOTE } from "@/lib/graphql";

export async function togglePinAction(documentId: string) {
  console.log(`[starter] togglePinAction(${documentId}) not wired yet`);
}

export async function archiveNoteAction(documentId: string) {
  console.log(`[starter] archiveNoteAction(${documentId}) not wired yet`);
}
