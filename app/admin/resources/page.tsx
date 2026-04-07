import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import { getAdminResourcesPage } from "@/lib/resources";
import AdminTabs from "@/components/admin-tabs";
import ResourcesAdminPanel from "./resources-admin-panel";

type AdminResourcesPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
};

const normalizeQuery = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
};

const normalizePage = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
};

export default async function AdminResourcesPage({ searchParams }: AdminResourcesPageProps) {
  if (!(await isAdminRequest())) {
    redirect("/admin/login?next=/admin/resources");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const q = normalizeQuery(resolvedSearchParams?.q);
  const page = normalizePage(resolvedSearchParams?.page);
  const resourcesPage = await getAdminResourcesPage({
    q: q || undefined,
    page,
    pageSize: 20
  });

  return (
    <div className="content-stack">
      <section className="panel admin-shell-head">
        <div className="admin-shell-title">
          <h1>Админ-панель</h1>
          <p>Управление карточками полезных ресурсов.</p>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn-secondary">
            Выйти из админки
          </button>
        </form>
      </section>

      <AdminTabs active="resources" />

      <ResourcesAdminPanel
        initialResources={resourcesPage.items}
        searchQuery={q}
        currentPage={resourcesPage.page}
        totalResources={resourcesPage.total}
        pageSize={resourcesPage.pageSize}
      />
    </div>
  );
}
