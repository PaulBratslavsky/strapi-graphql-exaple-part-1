import { Badge } from '@/components/ui/badge';

type Tag = { name: string; slug: string; color?: string | null };

export function TagBadge({ tag }: { tag: Tag }) {
  const bg = tag.color ?? '#6366f1';
  return (
    <Badge
      variant="default"
      style={{ backgroundColor: bg, color: 'white' }}
      className="font-medium"
    >
      {tag.name}
    </Badge>
  );
}
