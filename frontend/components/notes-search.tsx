'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const DEBOUNCE_MS = 300;

export function NotesSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function pushQuery(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = next.trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => pushQuery(next), DEBOUNCE_MS);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    pushQuery(value);
  }

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setValue('');
    pushQuery('');
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="search"
          name="q"
          value={value}
          onChange={onChange}
          placeholder="Search notes…"
          className="w-full rounded-md border bg-background px-3 py-2 pr-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="off"
        />
        {isPending && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          />
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
        >
          Clear
        </button>
      )}
    </form>
  );
}
