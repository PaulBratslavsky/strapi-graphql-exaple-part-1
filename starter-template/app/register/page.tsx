import { registerAction } from "./actions";

// Part 4 Step 8.4 fills this page in. Same shape as /login: form posts to
// `registerAction`, which is a stub today. The structural pieces are here so
// Part 4 only wires the action.

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      {error === "invalid" && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not create that account. The username or email may already be
          taken, or the password is too short.
        </p>
      )}
      <form action={registerAction} className="space-y-3">
        <input
          name="username"
          type="text"
          required
          placeholder="username"
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="email"
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
          Register
        </button>
      </form>
      <p className="text-sm text-neutral-500">
        Already have an account?{" "}
        <a href="/login" className="underline">
          Sign in
        </a>
        .
      </p>
    </div>
  );
}
