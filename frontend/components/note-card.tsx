import Link from 'next/link';
import { Pin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagBadge } from '@/components/tag-badge';

type Note = {
  documentId: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  excerpt: string;
  wordCount: number;
  readingTime: number;
  tags: Array<{ documentId: string; name: string; slug: string; color?: string | null }>;
};

export function NoteCard({ note }: { note: Note }) {
  return (
    <Link href={`/notes/${note.documentId}`} className="block group">
      <Card className="transition-colors group-hover:border-foreground/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {note.pinned && <Pin className="h-4 w-4 text-amber-500" />}
            <span className="truncate">{note.title}</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {note.wordCount} words · {note.readingTime} min read
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {note.excerpt}
          </p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((t) => (
                <TagBadge key={t.documentId} tag={t} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
