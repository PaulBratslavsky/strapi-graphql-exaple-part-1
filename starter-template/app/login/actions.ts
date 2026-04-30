"use server";

// TODO (Part 4 Step 8.4): wire this Server Action to the LOGIN mutation.
// Until then, every submission console.logs and returns. The login form
// in `page.tsx` posts here.

export async function loginAction(formData: FormData) {
  const payload = Object.fromEntries(formData);
  console.log("[starter] loginAction:", payload);
}
