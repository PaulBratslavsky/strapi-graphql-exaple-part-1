async function logNotesQuery(
  next: any,
  parent: any,
  args: any,
  context: any,
  info: any,
) {
  const label = `[graphql] Query.notes (${JSON.stringify(args?.filters ?? {})})`;
  console.time(label);
  try {
    return await next(parent, args, context, info);
  } finally {
    console.timeEnd(label);
  }
}

async function applyNotesCacheHint(
  next: any,
  parent: any,
  args: any,
  context: any,
  info: any,
) {
  if (info?.cacheControl?.setCacheHint) {
    info.cacheControl.setCacheHint({ maxAge: 30, scope: 'PUBLIC' });
  }
  return next(parent, args, context, info);
}

export default function middlewaresAndPolicies() {
  return {
    resolversConfig: {
      'Query.notes': {
        auth: false,
        middlewares: [logNotesQuery, applyNotesCacheHint],
        policies: ['global::include-archived-requires-header'],
      },
      'Query.note': { auth: false },
      'Query.tags': { auth: false },
      'Query.tag': { auth: false },
    },
  };
}
