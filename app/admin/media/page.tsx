import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import AdminTabs from "@/components/admin-tabs";
import MediaCleanupForm from "./media-cleanup-form";

export default async function AdminMediaPage() {
  if (!(await isAdminRequest())) {
    redirect("/admin/login?next=/admin/media");
  }

  return (
    <div className="content-stack">
      <section className="panel admin-shell-head">
        <div className="admin-shell-title">
          <h1>Админ-панель</h1>
          <p>Сервисные инструменты для управления локальными изображениями.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn-secondary">
            Выйти из админки
          </button>
        </form>
      </section>

      <AdminTabs active="media" />

      <MediaCleanupForm />
    </div>
  );
}
