import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { toAbsoluteUrl } from "@/lib/site-url";
import MarkdownRenderer from "@/components/markdown-renderer";
import ReadLaterButton from "@/components/read-later-button";
import PostEngagement from "@/components/post-engagement";

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
          url: "/opengraph-image",
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
      images: ["/twitter-image"]
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

  return (
    <article className="panel article-view">
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
          <span>{new Date(post.date).toLocaleDateString("ru-RU")}</span>
          <span>{post.readingTimeMinutes} мин чтения</span>
        </div>
        <h1>{post.title}</h1>
      </header>
      <MarkdownRenderer markdown={post.content} className="markdown-body" />
      <PostEngagement postId={post.id} />
    </article>
  );
}
