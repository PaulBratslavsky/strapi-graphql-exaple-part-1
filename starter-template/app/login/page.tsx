import { loginAction } from "./actions";

// Part 4 Step 8.4 fills this page in. The form posts to `loginAction`,
// which currently console.logs. The structural pieces (form fields, error
// banner placeholder, link to /register) are here so Part 4 only wires up
// the action.

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {error === "invalid" && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Invalid username or password.
        </p>
      )}
      <form action={loginAction} className="space-y-3">
        <input type="hidden" name="returnTo" value="" />
        <input
          name="identifier"
          type="text"
          required
          placeholder="username or email"
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="password"
          className="w-full rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="w-full rounded bg-black px-3 py-2 text-white"
        >
          Sign in
        </button>
      </form>
      <p className="text-sm text-neutral-500">
        No account?{" "}
        <a href="/register" className="underline">
          Register here
        </a>
        .
      </p>
    </div>
  );
}
