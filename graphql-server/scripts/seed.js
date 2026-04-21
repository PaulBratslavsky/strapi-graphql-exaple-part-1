'use strict';

const { createStrapi, compileStrapi } = require('@strapi/strapi');

const TAGS = [
  { name: 'Work', color: '#2563eb' },
  { name: 'Personal', color: '#db2777' },
  { name: 'Ideas', color: '#f59e0b' },
  { name: 'Reading', color: '#10b981' },
  { name: 'Recipe', color: '#ef4444' },
];

const paragraph = (text) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
});

const NOTES = [
  {
    title: 'Weekly review template',
    pinned: true,
    archived: false,
    tagNames: ['Work'],
    content: [
      paragraph('What went well this week?'),
      paragraph('What didn\'t go well?'),
      paragraph('What will I change next week?'),
    ],
  },
  {
    title: 'Sourdough starter log',
    pinned: true,
    archived: false,
    tagNames: ['Recipe', 'Personal'],
    content: [
      paragraph('Fed the starter at 8am with 50g flour + 50g water.'),
      paragraph('Doubled by noon. Ready for a levain build.'),
    ],
  },
  {
    title: 'Book notes: The Pragmatic Programmer',
    pinned: false,
    archived: false,
    tagNames: ['Reading', 'Work'],
    content: [
      paragraph('Prefer plain text. Keep knowledge in editable formats.'),
      paragraph('Orthogonality reduces the cost of change.'),
      paragraph('Automate everything that can be automated.'),
    ],
  },
  {
    title: 'App idea: habit streak widget',
    pinned: false,
    archived: false,
    tagNames: ['Ideas'],
    content: [
      paragraph('Minimal home screen widget showing current streak for up to 3 habits.'),
      paragraph('Tap to check-in. Hold to edit. Sync via iCloud.'),
    ],
  },
  {
    title: 'Meeting notes: Q2 planning kickoff',
    pinned: false,
    archived: false,
    tagNames: ['Work'],
    content: [
      paragraph('Attendees: Pat, Sam, Kim, Alex.'),
      paragraph('Key decision: ship GraphQL tutorial by end of May.'),
      paragraph('Follow-ups: Sam to draft outline, Kim to gather examples.'),
    ],
  },
  {
    title: 'Grocery list',
    pinned: false,
    archived: false,
    tagNames: ['Personal'],
    content: [
      paragraph('Oats, milk, eggs, tomatoes, basil, mozzarella, lemons.'),
    ],
  },
  {
    title: 'Thoughts on static site generators',
    pinned: false,
    archived: false,
    tagNames: ['Ideas', 'Reading'],
    content: [
      paragraph('Astro\'s islands architecture is a nice middle ground.'),
      paragraph('Next.js App Router is overkill for a personal blog but great for a CMS demo.'),
      paragraph('For this tutorial, Next.js makes the Strapi integration story more realistic.'),
    ],
  },
  {
    title: 'Trip planning: Lisbon, October',
    pinned: false,
    archived: false,
    tagNames: ['Personal'],
    content: [
      paragraph('Flights: check TAP and United fares 6-8 weeks out.'),
      paragraph('Stay: Alfama or Principe Real.'),
      paragraph('Must-do: Time Out Market, tram 28, day trip to Sintra.'),
    ],
  },
  {
    title: 'Old meeting notes from last year',
    pinned: false,
    archived: true,
    tagNames: ['Work'],
    content: [
      paragraph('Archived — kept for reference but no longer relevant.'),
    ],
  },
  {
    title: 'Draft: blog post ideas',
    pinned: false,
    archived: true,
    tagNames: ['Ideas'],
    content: [
      paragraph('Most of these were explored in other posts — archiving.'),
    ],
  },
];

async function run() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  try {
    const tagsByName = new Map();

    for (const tag of TAGS) {
      const existing = await app.documents('api::tag.tag').findFirst({
        filters: { name: { $eq: tag.name } },
      });
      if (existing) {
        tagsByName.set(tag.name, existing);
        continue;
      }
      const created = await app.documents('api::tag.tag').create({
        data: {
          name: tag.name,
          slug: tag.name.toLowerCase().replace(/\s+/g, '-'),
          color: tag.color,
        },
      });
      tagsByName.set(tag.name, created);
    }

    for (const note of NOTES) {
      const existing = await app.documents('api::note.note').findFirst({
        filters: { title: { $eq: note.title } },
      });
      if (existing) continue;

      const tagIds = note.tagNames
        .map((n) => tagsByName.get(n)?.documentId)
        .filter(Boolean);

      await app.documents('api::note.note').create({
        data: {
          title: note.title,
          content: note.content,
          pinned: note.pinned,
          archived: note.archived,
          tags: tagIds,
        },
      });
    }

    console.log(`Seeded ${TAGS.length} tags and ${NOTES.length} notes.`);
  } finally {
    await app.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
