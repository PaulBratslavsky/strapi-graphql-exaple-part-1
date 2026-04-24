import Link from "next/link";

type Tag = { name: string; slug: string; color?: string | null };

// Tag.color is an enumeration on the server (red/blue/green/yellow/purple/gray).
// Map each enum value to a Tailwind utility pair.
const COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-100 text-red-800 border-red-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  green: "bg-green-100 text-green-800 border-green-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  gray: "bg-neutral-100 text-neutral-800 border-neutral-200",
};

export function TagBadge({ tag }: { tag: Tag }) {
  const classes = COLOR_CLASSES[tag.color ?? "gray"] ?? COLOR_CLASSES.gray;
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium hover:opacity-80 ${classes}`}
    >
      {tag.name}
    </Link>
  );
}
