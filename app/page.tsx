import Link from "next/link";
import { getAllPostsMeta } from "@/lib/posts";
import ReadLaterList from "@/components/read-later-list";

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

  const posts = await getAllPostsMeta({
    q: query
  });

  return (
    <section className="content-stack">
      <header className="content-header">
        <h1>Posts</h1>
        <p>
          {posts.length} статей
          {query && (
            <>
              {" "}
              по запросу <strong>{query}</strong>
            </>
          )}
        </p>
      </header>

      <ReadLaterList />

      <div className="post-list">
        {posts.length === 0 ? (
          <article className="panel empty-panel">
            <p>Ничего не найдено. Попробуй изменить фильтры или опубликовать новую статью.</p>
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
    </section>
  );
}
