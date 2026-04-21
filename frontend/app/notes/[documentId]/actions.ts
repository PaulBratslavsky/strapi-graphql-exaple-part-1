'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/apollo-client';
import { TOGGLE_PIN, ARCHIVE_NOTE, DUPLICATE_NOTE } from '@/lib/graphql';

export async function togglePinAction(documentId: string) {
  await getClient().mutate({
    mutation: TOGGLE_PIN,
    variables: { documentId },
  });
  revalidatePath(`/notes/${documentId}`);
  revalidatePath('/notes');
}

export async function archiveNoteAction(documentId: string) {
  await getClient().mutate({
    mutation: ARCHIVE_NOTE,
    variables: { documentId },
  });
  revalidatePath('/notes');
  revalidatePath('/archive');
  redirect('/notes');
}

export async function duplicateNoteAction(documentId: string) {
  const { data } = await getClient().mutate<{
    duplicateNote: { documentId: string };
  }>({
    mutation: DUPLICATE_NOTE,
    variables: { documentId },
  });
  revalidatePath('/notes');
  const newId = data?.duplicateNote?.documentId;
  if (newId) redirect(`/notes/${newId}`);
}
