import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import { getAboutContent } from "@/lib/site-content";
import AdminTabs from "@/components/admin-tabs";
import AboutEditorForm from "./about-editor-form";

export default async function AdminAboutPage() {
  if (!(await isAdminRequest())) {
    redirect("/admin/login?next=/admin/about");
  }

  const aboutContent = await getAboutContent();

  return (
    <div className="content-stack">
      <section className="panel admin-shell-head">
        <div className="admin-shell-title">
          <h1>Админ-панель</h1>
          <p>Редактирование разделов профиля и публикаций.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn-secondary">
            Выйти из админки
          </button>
        </form>
      </section>

      <AdminTabs active="about" />

      <AboutEditorForm
        initialAboutTitle={aboutContent.aboutTitle}
        initialWhoIAmTitle={aboutContent.whoIAmTitle}
        initialAbout={aboutContent.about}
        initialWhoIAm={aboutContent.whoIAm}
      />
    </div>
  );
}
