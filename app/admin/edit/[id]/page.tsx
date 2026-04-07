import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import { getPostById } from "@/lib/posts";
import AdminTabs from "@/components/admin-tabs";
import PostEditorForm from "../../post-editor-form";

const parseId = (value: string): number => Number.parseInt(value, 10);

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id: rawId } = await params;

  if (!(await isAdminRequest())) {
    redirect(`/admin/login?next=/admin/edit/${rawId}`);
  }

  const id = parseId(rawId);
  if (Number.isNaN(id)) {
    notFound();
  }

  const post = await getPostById(id);
  if (!post) {
    notFound();
  }

  return (
    <div className="content-stack">
      <section className="panel admin-shell-head">
        <div className="admin-shell-title">
          <h1>Админ-панель</h1>
          <p>Редактирование опубликованной статьи.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn-secondary">
            Выйти из админки
          </button>
        </form>
      </section>

      <AdminTabs active="published" />

      <section className="panel">
        <Link href="/admin/published" className="btn-secondary">
          ← Назад к списку статей
        </Link>
      </section>

      <PostEditorForm
        mode="edit"
        initialPost={{
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          date: post.date,
          markdown: post.content
        }}
      />
    </div>
  );
}
