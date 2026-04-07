import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import AdminTabs from "@/components/admin-tabs";
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

      <AdminTabs active="new" />

      <PostEditorForm mode="create" />

      <p className="section-note">
        После публикации статья автоматически появится на <Link href="/">главной странице</Link>. Редактировать можно во
        вкладке <strong>Опубликованные</strong>.
      </p>
    </div>
  );
}
