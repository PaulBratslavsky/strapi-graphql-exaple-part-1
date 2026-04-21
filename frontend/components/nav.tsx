import Link from 'next/link';

const LINKS = [
  { href: '/notes', label: 'Notes' },
  { href: '/stats', label: 'Stats' },
  { href: '/archive', label: 'Archive' },
];

export function Nav() {
  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/notes" className="text-lg font-semibold tracking-tight">
          Notes
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
