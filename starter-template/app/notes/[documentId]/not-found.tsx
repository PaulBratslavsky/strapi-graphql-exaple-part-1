import Link from "next/link";

// Custom 404 for the note detail route. Catches `notFound()` calls from
// `app/notes/[documentId]/page.tsx`. Generic copy here so it works whether
// or not Part 4 has been completed; Part 4 Step 8.7 swaps in a more
// detailed message that explains the ownership middleware.

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Note not found</h1>
      <p className="text-sm text-neutral-600">
        This note doesn&rsquo;t exist or isn&rsquo;t available to you.
      </p>
      <Link
        href="/"
        className="inline-block rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        Back to your notes
      </Link>
    </div>
  );
}
