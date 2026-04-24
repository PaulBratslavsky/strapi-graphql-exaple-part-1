"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  togglePinAction,
  archiveNoteAction,
} from "@/app/notes/[documentId]/actions";

const BTN =
  "rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50";

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
      <Link href={`/notes/${documentId}/edit`} className={BTN}>
        Edit
      </Link>
      <button
        type="button"
        className={BTN}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await togglePinAction(documentId);
          })
        }
      >
        {pinned ? "Unpin" : "Pin"}
      </button>
      <button
        type="button"
        className={`${BTN} text-red-700 hover:bg-red-50`}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await archiveNoteAction(documentId);
          })
        }
      >
        Archive
      </button>
    </div>
  );
}
