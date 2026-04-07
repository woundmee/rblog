import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import PostEditorForm from "../post-editor-form";

export default async function NewPostPage() {
  if (!(await isAdminRequest())) {
    redirect("/admin/login?next=/admin/new");
  }

  return (
    <div className="content-stack">
      <section className="panel admin-shell-head">
        <div className="admin-shell-title">
          <h1>Админ-панель</h1>
          <p>Создание, редактирование и управление публикациями.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn-secondary">
            Выйти из админки
          </button>
        </form>
      </section>

      <section className="panel admin-tabs">
        <Link href="/admin/new" className="admin-tab active">
          Статьи
        </Link>
        <Link href="/admin/published" className="admin-tab">
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

      <PostEditorForm mode="create" />

      <p className="section-note">
        После публикации статья автоматически появится на <Link href="/">главной странице</Link>. Редактировать можно во
        вкладке <strong>Опубликованные</strong>.
      </p>
    </div>
  );
}
