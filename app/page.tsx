import PostsInfiniteList from "@/components/posts-infinite-list";
import ResourcesInfiniteGrid from "@/components/resources-infinite-grid";
import { getPostsMetaPage } from "@/lib/posts";
import { getResourcesPage } from "@/lib/resources";

type HomePageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

const normalizeQuery = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = normalizeQuery(resolvedSearchParams?.q);
  const postsPageSize = 30;
  const resourcesPageSize = 40;

  const postsPagePromise = getPostsMetaPage({
    q: query,
    page: 1,
    pageSize: postsPageSize
  });
  const resourcesPagePromise = query
    ? getResourcesPage({
        q: query,
        page: 1,
        pageSize: resourcesPageSize
      })
    : Promise.resolve({
        items: [],
        total: 0,
        page: 1,
        pageSize: resourcesPageSize,
        hasMore: false
      });

  const [postsPage, resourcesPage] = await Promise.all([postsPagePromise, resourcesPagePromise]);

  const totalResults = postsPage.total + resourcesPage.total;
  const noSearchResults = query.length > 0 && totalResults === 0;

  return (
    <section className="content-stack">
      <header className="content-header">
        <h1>{query ? "Поиск" : "Главная"}</h1>
        {query ? (
          noSearchResults ? null : (
            <p>
              {totalResults} результатов по запросу <strong>{query}</strong>
            </p>
          )
        ) : (
          <p>
            {postsPage.total} статей
          </p>
        )}
      </header>

      {query && !noSearchResults && (
        <section className="section-head section-head-compact">
          <h2>Главная</h2>
          <p>{postsPage.total} найдено</p>
        </section>
      )}

      {noSearchResults ? (
        <p className="section-note">Ничего не найдено</p>
      ) : (
        <PostsInfiniteList
          initialItems={postsPage.items}
          initialPage={postsPage.page}
          pageSize={postsPage.pageSize}
          initialHasMore={postsPage.hasMore}
          query={query || undefined}
          emptyMessage="Ничего не найдено"
        />
      )}

      {query && !noSearchResults && (
        <>
          <section className="section-head section-head-compact">
            <h2>Ресурсы</h2>
            <p>{resourcesPage.total} найдено</p>
          </section>
          <ResourcesInfiniteGrid
            initialItems={resourcesPage.items}
            initialPage={resourcesPage.page}
            pageSize={resourcesPage.pageSize}
            initialHasMore={resourcesPage.hasMore}
            query={query || undefined}
            emptyMessage="По ресурсам ничего не найдено."
          />
        </>
      )}
    </section>
  );
}
