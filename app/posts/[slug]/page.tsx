import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { toAbsoluteUrl } from "@/lib/site-url";
import MarkdownRenderer from "@/components/markdown-renderer";
import ReadLaterButton from "@/components/read-later-button";
import PostEngagement from "@/components/post-engagement";
import ReadingProgress from "@/components/reading-progress";
import ArticleToc from "@/components/article-toc";
import { extractMarkdownHeadings } from "@/lib/markdown-headings";

type PostPageParams = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PostPageParams): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Статья не найдена"
    };
  }

  const title = post.title;
  const description = post.excerpt?.trim() || "Статья в блоге rblog.";
  const canonicalUrl = toAbsoluteUrl(`/posts/${post.slug}`);
  const postOgImageUrl = toAbsoluteUrl(`/posts/${post.slug}/opengraph-image`);
  const postTwitterImageUrl = toAbsoluteUrl(`/posts/${post.slug}/twitter-image`);
  const publishedDate = new Date(post.date);
  const publishedTime = Number.isNaN(publishedDate.getTime()) ? undefined : publishedDate.toISOString();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalUrl,
      publishedTime,
      images: [
        {
          url: postOgImageUrl,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [postTwitterImageUrl]
    }
  };
}

export default async function PostPage({
  params
}: PostPageParams) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const related = await getRelatedPosts(post.id, 4);
  const headings = extractMarkdownHeadings(post.content);

  return (
    <article className="panel article-view">
      <ReadingProgress />
      <header className="article-header">
        <div className="article-header-actions">
          <Link href="/" className="article-back-link">
            ← Назад
          </Link>
          <ReadLaterButton
            post={{
              kind: "post",
              id: post.id,
              slug: post.slug,
              title: post.title,
              excerpt: post.excerpt,
              date: post.date
            }}
          />
        </div>
        <div className="article-meta">
          <span className="article-meta-item" title="Дата публикации">
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path d="M8 3v4M16 3v4M4 10h16" />
            </svg>
            <span>{new Date(post.date).toLocaleDateString("ru-RU")}</span>
          </span>
          <span className="article-meta-item" title="Время чтения">
            <svg viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v4l3 2" />
            </svg>
            <span>{post.readingTimeMinutes} мин</span>
          </span>
          <span className="article-meta-item" title="Уникальные просмотры">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            <span>{post.uniqueViews}</span>
          </span>
        </div>
        <h1>{post.title}</h1>
      </header>
      <ArticleToc items={headings} />
      <MarkdownRenderer markdown={post.content} className="markdown-body" />
      <PostEngagement postId={post.id} />
      {related.length > 0 && (
        <section className="article-related">
          <header className="section-head section-head-compact">
            <h2>Похожие статьи</h2>
          </header>
          <div className="article-related-grid">
            {related.map((item) => (
              <Link key={item.id} href={`/posts/${item.slug}`} className="article-related-card">
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
                <span>
                  {new Date(item.date).toLocaleDateString("ru-RU")} · {item.readingTimeMinutes} мин
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
