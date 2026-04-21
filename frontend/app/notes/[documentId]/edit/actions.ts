'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/apollo-client';
import { UPDATE_NOTE } from '@/lib/graphql';
import { textToBlocks } from '@/lib/blocks';

export async function updateNoteAction(
  documentId: string,
  formData: FormData,
) {
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');
  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean);

  if (!title) {
    return { error: 'Title is required.' };
  }

  await getClient().mutate({
    mutation: UPDATE_NOTE,
    variables: {
      documentId,
      data: {
        title,
        content: textToBlocks(content),
        tags: tagIds,
      },
    },
  });

  revalidatePath('/notes');
  revalidatePath(`/notes/${documentId}`);
  redirect(`/notes/${documentId}`);
}
