// Step 7: every auto-generated query in the post.
// Each test reproduces a query block from part-1.md verbatim and asserts the
// shape matches what the post claims.

import { assert, header, gql } from "./_lib.mjs";

header("Step 7: auto-generated queries");

// 7.1: list articles (basic shape)
{
  const { json } = await gql(`query Articles {
    articles { documentId title description slug publishedAt }
  }`);
  const arts = json.data?.articles ?? [];
  assert(arts.length >= 5, `Articles query returns >=5 (got ${arts.length})`);
  assert(arts.every((a) => typeof a.documentId === "string" && a.documentId.length > 5), "every entry has documentId");
  assert(arts.every((a) => typeof a.title === "string"), "every entry has title");
  assert(arts.every((a) => a.publishedAt !== null), "every entry has publishedAt (i.e., is published)");
}

// 7.2: traverse relations in one query
{
  const { json } = await gql(`query ArticlesWithRelations {
    articles {
      title
      author { name email }
      category { name slug }
    }
  }`);
  const arts = json.data?.articles ?? [];
  assert(arts.length >= 5, "relations query returns >=5 articles");
  // At least some articles should have an author and a category populated.
  const withAuthor = arts.filter((a) => a.author && typeof a.author.name === "string");
  const withCategory = arts.filter((a) => a.category && typeof a.category.name === "string");
  assert(withAuthor.length > 0, `at least one article has author populated (${withAuthor.length}/${arts.length})`);
  assert(withCategory.length > 0, `at least one article has category populated (${withCategory.length}/${arts.length})`);
}

// 7.3: filter by title containsi "internet" (the post's exact example)
{
  const { json } = await gql(`query FilteredArticles {
    articles(filters: { title: { containsi: "internet" } }) { documentId title }
  }`);
  const arts = json.data?.articles ?? [];
  assert(arts.length >= 1, `filter containsi "internet" returns >=1 article (got ${arts.length})`);
  assert(arts.every((a) => /internet/i.test(a.title)), "every result actually has 'internet' in its title");
}

// 7.4: filter on a relation: category.slug eq "news"
{
  const { json } = await gql(`query NewsArticles {
    articles(filters: { category: { slug: { eq: "news" } } }) {
      documentId title category { name slug }
    }
  }`);
  // The seed may or may not have a 'news' category. Either result is fine, but the
  // query must succeed and any results must satisfy the filter.
  if (json.errors) console.error("  GraphQL errors:", JSON.stringify(json.errors));
  assert(!json.errors, "category.slug=news query has no errors");
  const arts = json.data?.articles ?? [];
  assert(arts.every((a) => a.category?.slug === "news"), "every returned article has category.slug==='news'");
}

// 7.5: sort + paginate
{
  const { json } = await gql(`query PagedArticles {
    articles(sort: "title:asc", pagination: { page: 1, pageSize: 10 }) { documentId title }
  }`);
  const arts = json.data?.articles ?? [];
  assert(arts.length >= 1, "paged query returns at least 1 article");
  for (let i = 1; i < arts.length; i++) {
    assert(arts[i - 1].title.localeCompare(arts[i].title) <= 0, `sort:title:asc holds at index ${i}`);
  }
  assert(arts.length <= 10, `pageSize:10 respected (got ${arts.length})`);
}

// 7.6: fetch a single article by documentId
{
  const list = await gql(`{ articles { documentId } }`);
  const docId = list.json.data.articles[0].documentId;
  const { json } = await gql(
    `query Article($documentId: ID!) {
      article(documentId: $documentId) {
        documentId title description slug
        author { name }
        category { name }
      }
    }`,
    { documentId: docId }
  );
  assert(json.data?.article?.documentId === docId, "single-article fetch returns the requested document");
}

console.log("\nStep 7 OK");
