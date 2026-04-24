import Link from "next/link";

const LINKS = [
  { href: "/", label: "Notes" },
  { href: "/search", label: "Search" },
  { href: "/stats", label: "Stats" },
];

export function Nav() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          Notes
        </Link>
        <nav className="flex items-center gap-5 text-sm text-neutral-600">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-black">
              {l.label}
            </Link>
          ))}
          <Link
            href="/notes/new"
            className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            New
          </Link>
        </nav>
      </div>
    </header>
  );
}
