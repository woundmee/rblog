import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import { getAdminPostsPage } from "@/lib/posts";
import AdminPublishedActions from "@/components/admin-published-actions";
import AdminTabs from "@/components/admin-tabs";

type AdminPublishedPageProps = {
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

const makePageHref = (query: string, page: number): string => {
  const params = new URLSearchParams();
  if (query.length > 0) {
    params.set("q", query);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `/admin/published?${qs}` : "/admin/published";
};

export default async function AdminPublishedPage({ searchParams }: AdminPublishedPageProps) {
  if (!(await isAdminRequest())) {
    redirect("/admin/login?next=/admin/published");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const q = normalizeQuery(resolvedSearchParams?.q);
  const page = normalizePage(resolvedSearchParams?.page);
  const postsPage = await getAdminPostsPage({
    q: q || undefined,
    page,
    pageSize: 20
  });
  const totalPages = Math.max(1, Math.ceil(postsPage.total / postsPage.pageSize));

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

      <AdminTabs active="published" />

      <section className="panel admin-list">
        <header className="section-head section-head-compact admin-list-header">
          <h2>Опубликованные статьи</h2>
          <p>Найди публикацию по заголовку и открой для редактирования.</p>
        </header>

        <form action="/admin/published" method="get" className="admin-search-form">
          <input type="search" name="q" placeholder="Поиск по заголовку..." defaultValue={q} />
          <button type="submit" className="btn-secondary">
            Найти
          </button>
        </form>

        {postsPage.items.length === 0 ? (
          <p>Пока нет статей.</p>
        ) : (
          <div className="admin-posts">
            {postsPage.items.map((post) => (
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

        {postsPage.total > postsPage.pageSize && (
          <nav className="admin-pagination" aria-label="Навигация по страницам статей">
            <Link
              href={makePageHref(q, Math.max(1, postsPage.page - 1))}
              className={`btn-secondary${postsPage.page <= 1 ? " is-disabled" : ""}`}
              aria-disabled={postsPage.page <= 1}
              tabIndex={postsPage.page <= 1 ? -1 : undefined}
            >
              Назад
            </Link>
            <span className="section-note">
              Страница {postsPage.page} из {totalPages}
            </span>
            <Link
              href={makePageHref(q, Math.min(totalPages, postsPage.page + 1))}
              className={`btn-secondary${postsPage.page >= totalPages ? " is-disabled" : ""}`}
              aria-disabled={postsPage.page >= totalPages}
              tabIndex={postsPage.page >= totalPages ? -1 : undefined}
            >
              Вперед
            </Link>
          </nav>
        )}
      </section>
    </div>
  );
}
