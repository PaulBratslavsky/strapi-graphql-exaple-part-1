'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getClient } from '@/lib/apollo-client';
import { CREATE_NOTE } from '@/lib/graphql';

function textToBlocks(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\n{2,}/).map((para) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: para }],
  }));
}

export async function createNoteAction(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '');
  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean);

  if (!title) {
    return { error: 'Title is required.' };
  }

  const { data } = await getClient().mutate<{
    createNote: { documentId: string };
  }>({
    mutation: CREATE_NOTE,
    variables: {
      data: {
        title,
        content: textToBlocks(content),
        pinned: false,
        archived: false,
        tags: tagIds,
      },
    },
  });

  revalidatePath('/notes');
  const newId = data?.createNote?.documentId;
  if (newId) redirect(`/notes/${newId}`);
}
