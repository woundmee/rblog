import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import { getAnalyticsOverview } from "@/lib/engagement";

export default async function AdminAnalyticsPage() {
  if (!(await isAdminRequest())) {
    redirect("/admin/login?next=/admin/analytics");
  }

  const analytics = await getAnalyticsOverview();
  const maxTopViews = Math.max(...analytics.topPosts.map((post) => post.views), 1);
  const maxDailyViews = Math.max(...analytics.daily.map((day) => day.views), 1);

  return (
    <div className="content-stack">
      <section className="panel admin-shell-head">
        <div className="admin-shell-title">
          <h1>Админ-панель</h1>
          <p>Обзор активности пользователей и вовлеченности статей.</p>
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
        <Link href="/admin/published" className="admin-tab">
          Опубликованные
        </Link>
        <Link href="/admin/about" className="admin-tab">
          Обо мне
        </Link>
        <Link href="/admin/analytics" className="admin-tab active">
          Аналитика
        </Link>
      </section>

      <section className="analytics-grid">
        <article className="panel analytics-card">
          <p>Просмотры</p>
          <strong>{analytics.totals.totalViews}</strong>
        </article>
        <article className="panel analytics-card">
          <p>Уникальные посетители</p>
          <strong>{analytics.totals.uniqueVisitors}</strong>
        </article>
        <article className="panel analytics-card">
          <p>Эмодзи-реакции</p>
          <strong>{analytics.totals.totalReactions}</strong>
        </article>
        <article className="panel analytics-card">
          <p>Оценки</p>
          <strong>{analytics.totals.totalRatings}</strong>
        </article>
      </section>

      <section className="panel">
        <header className="section-head section-head-compact">
          <h2>Топ статей по просмотрам</h2>
        </header>
        <div className="analytics-bars">
          {analytics.topPosts.length === 0 ? (
            <p>Пока нет данных.</p>
          ) : (
            analytics.topPosts.map((post) => (
              <div key={`bar-${post.id}`} className="analytics-bar-row">
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                <div className="analytics-bar-track">
                  <div
                    className="analytics-bar-fill"
                    style={{ width: `${Math.max(6, Math.round((post.views / maxTopViews) * 100))}%` }}
                  />
                </div>
                <span>{post.views}</span>
              </div>
            ))
          )}
        </div>
        <div className="analytics-list">
          {analytics.topPosts.length === 0 ? (
            <p>Пока нет данных.</p>
          ) : (
            analytics.topPosts.map((post) => (
              <article key={post.id} className="analytics-row">
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                <span>{post.views} просмотров</span>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <header className="section-head section-head-compact">
          <h2>Просмотры за 7 дней</h2>
        </header>
        <div className="analytics-mini-chart">
          {analytics.daily.length === 0 ? (
            <p>Пока нет данных.</p>
          ) : (
            analytics.daily.map((day) => (
              <div key={`day-${day.day}`} className="analytics-mini-col">
                <div className="analytics-mini-track">
                  <div
                    className="analytics-mini-fill"
                    style={{ height: `${Math.max(8, Math.round((day.views / maxDailyViews) * 100))}%` }}
                  />
                </div>
                <small>{day.day.slice(5)}</small>
              </div>
            ))
          )}
        </div>
        <div className="analytics-list">
          {analytics.daily.length === 0 ? (
            <p>Пока нет данных.</p>
          ) : (
            analytics.daily.map((day) => (
              <article key={day.day} className="analytics-row">
                <span>{day.day}</span>
                <span>{day.views}</span>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
