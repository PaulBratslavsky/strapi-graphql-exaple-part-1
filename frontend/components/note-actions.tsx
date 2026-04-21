'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Archive, Copy, Pencil, Pin, PinOff } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  togglePinAction,
  archiveNoteAction,
  duplicateNoteAction,
} from '@/app/notes/[documentId]/actions';

export function NoteActions({
  documentId,
  pinned,
}: {
  documentId: string;
  pinned: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/notes/${documentId}/edit`}
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Link>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await togglePinAction(documentId);
          })
        }
      >
        {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        {pinned ? 'Unpin' : 'Pin'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await duplicateNoteAction(documentId);
          })
        }
      >
        <Copy className="h-4 w-4" />
        Duplicate
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await archiveNoteAction(documentId);
          })
        }
      >
        <Archive className="h-4 w-4" />
        Archive
      </Button>
    </div>
  );
}
