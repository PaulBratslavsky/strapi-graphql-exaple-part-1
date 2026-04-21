'use client';

import { useTransition } from 'react';
import { Archive, Copy, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
