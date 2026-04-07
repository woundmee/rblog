import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import AdminTabs from "@/components/admin-tabs";
import { getAdContent } from "@/lib/site-content";
import AdsEditorForm from "./ads-editor-form";

export default async function AdminAdsPage() {
  if (!(await isAdminRequest())) {
    redirect("/admin/login?next=/admin/ads");
  }

  const adContent = await getAdContent();

  return (
    <div className="content-stack">
      <section className="panel admin-shell-head">
        <div className="admin-shell-title">
          <h1>Админ-панель</h1>
          <p>Управление рекламным блоком под navbar.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn-secondary">
            Выйти из админки
          </button>
        </form>
      </section>

      <AdminTabs active="ads" />

      <AdsEditorForm initialEnabled={adContent.enabled} initialMarkdown={adContent.markdown} />
    </div>
  );
}
