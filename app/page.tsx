import Link from "next/link";
import { getAllPostsMeta } from "@/lib/posts";
import { getAllResources } from "@/lib/resources";
import ResourceCard from "@/components/resource-card";

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

  const [posts, resources] = await Promise.all([
    getAllPostsMeta({
      q: query
    }),
    getAllResources({
      q: query
    })
  ]);

  const totalResults = posts.length + resources.length;

  return (
    <section className="content-stack">
      <header className="content-header">
        <h1>{query ? "Поиск" : "Статьи"}</h1>
        {query ? (
          <p>
            {totalResults} результатов по запросу <strong>{query}</strong>
          </p>
        ) : (
          <p>{posts.length} статей</p>
        )}
      </header>

      {query && (
        <section className="section-head section-head-compact">
          <h2>Статьи</h2>
          <p>{posts.length} найдено</p>
        </section>
      )}

      <div className="post-list">
        {posts.length === 0 ? (
          <article className="panel empty-panel">
            <p>
              {query
                ? "По статьям ничего не найдено."
                : "Ничего не найдено. Попробуй изменить фильтры или опубликовать новую статью."}
            </p>
          </article>
        ) : (
          posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.slug}`} className="panel post-card">
              <div className="post-card-meta">
                <span>{new Date(post.date).toLocaleDateString("ru-RU")}</span>
                <span>{post.readingTimeMinutes} мин чтения</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </Link>
          ))
        )}
      </div>

      {query && (
        <>
          <section className="section-head section-head-compact">
            <h2>Ресурсы</h2>
            <p>{resources.length} найдено</p>
          </section>

          {resources.length === 0 ? (
            <article className="panel empty-panel">
              <p>По ресурсам ничего не найдено.</p>
            </article>
          ) : (
            <div className="resources-grid">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
