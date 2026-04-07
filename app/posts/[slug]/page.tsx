import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import MarkdownRenderer from "@/components/markdown-renderer";
import ReadLaterButton from "@/components/read-later-button";
import PostEngagement from "@/components/post-engagement";

export default async function PostPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
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
