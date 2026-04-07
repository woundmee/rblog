import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import { getAdminPosts } from "@/lib/posts";
import AdminPublishedActions from "@/components/admin-published-actions";

export default async function AdminPublishedPage() {
  if (!(await isAdminRequest())) {
    redirect("/admin/login?next=/admin/published");
  }

  const posts = await getAdminPosts();

  return (
    <div className="content-stack">
      <section className="panel admin-shell-head">
        <div className="admin-shell-title">
          <h1>Админ-панель</h1>
          <p>Управление опубликованными статьями.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn-secondary">
            Выйти из админки
          </button>
        </form>
      </section>

      <section className="panel admin-tabs">
        <Link href="/admin/new" className="admin-tab">
          Статьи
        </Link>
        <Link href="/admin/published" className="admin-tab active">
          Опубликованные
        </Link>
        <Link href="/admin/resources" className="admin-tab">
          Ресурсы
        </Link>
        <Link href="/admin/about" className="admin-tab">
          Обо мне
        </Link>
        <Link href="/admin/analytics" className="admin-tab">
          Аналитика
        </Link>
      </section>

      <section className="panel admin-list">
        <header className="section-head section-head-compact admin-list-header">
          <h2>Опубликованные статьи</h2>
          <p>Открой публикацию для редактирования.</p>
        </header>
        {posts.length === 0 ? (
          <p>Пока нет статей.</p>
        ) : (
          <div className="admin-posts">
            {posts.map((post) => (
              <article key={post.id} className="admin-post-row">
                <div>
                  <h3>{post.title}</h3>
                  <p>{new Date(post.date).toLocaleDateString("ru-RU")}</p>
                </div>
                <AdminPublishedActions id={post.id} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
