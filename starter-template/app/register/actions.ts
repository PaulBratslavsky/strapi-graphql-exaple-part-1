"use server";

// TODO (Part 4 Step 8.4): wire this Server Action to the REGISTER mutation.

export async function registerAction(formData: FormData) {
  const payload = Object.fromEntries(formData);
  console.log("[starter] registerAction:", payload);
}
