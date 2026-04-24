"use server";

// TODO (Part 3 Step 5): wire this to the createNote Shadow CRUD mutation.

export async function createNoteAction(formData: FormData) {
  const payload = Object.fromEntries(formData);
  console.log("[starter] createNoteAction:", payload);
}
