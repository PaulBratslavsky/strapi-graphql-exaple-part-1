"use server";

// TODO (Part 3 Step 5): wire this to the updateNote Shadow CRUD mutation.

export async function updateNoteAction(
  documentId: string,
  formData: FormData,
) {
  const payload = Object.fromEntries(formData);
  console.log(`[starter] updateNoteAction(${documentId}):`, payload);
}
