import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import { getAnalyticsOverview } from "@/lib/engagement";
import AdminTabs from "@/components/admin-tabs";

export default async function AdminAnalyticsPage() {
  if (!(await isAdminRequest())) {
    redirect("/admin/login?next=/admin/analytics");
  }

  const analytics = await getAnalyticsOverview();
  const maxTopViews = Math.max(...analytics.topPosts.map((post) => post.views), 1);
  const maxDailyViews = Math.max(...analytics.daily.map((day) => day.views), 1);
  const chartWidth = 760;
  const chartHeight = 220;
  const chartPaddingX = 22;
  const chartPaddingY = 18;
  const chartUsableHeight = chartHeight - chartPaddingY * 2;
  const chartStep =
    analytics.daily.length > 1 ? (chartWidth - chartPaddingX * 2) / (analytics.daily.length - 1) : 0;

  const chartPoints = analytics.daily.map((day, index) => {
    const x = chartPaddingX + index * chartStep;
    const y = chartHeight - chartPaddingY - (day.views / maxDailyViews) * chartUsableHeight;
    return {
      ...day,
      x,
      y
    };
  });

  const chartPath = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const chartAreaPath =
    chartPoints.length > 0
      ? `M ${chartPoints[0].x} ${chartHeight - chartPaddingY} L ${chartPoints
          .map((point) => `${point.x} ${point.y}`)
          .join(" L ")} L ${chartPoints[chartPoints.length - 1].x} ${chartHeight - chartPaddingY} Z`
      : "";

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

      <AdminTabs active="analytics" />

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
        <div className="analytics-line-chart">
          {analytics.daily.length === 0 ? (
            <p>Пока нет данных.</p>
          ) : (
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} aria-label="График просмотров за неделю">
              <g className="analytics-line-grid">
                {[0, 1, 2, 3, 4].map((index) => {
                  const y = chartPaddingY + (chartUsableHeight / 4) * index;
                  return <line key={`grid-${index}`} x1={chartPaddingX} y1={y} x2={chartWidth - chartPaddingX} y2={y} />;
                })}
              </g>
              {chartAreaPath ? <path d={chartAreaPath} className="analytics-line-area" /> : null}
              <polyline points={chartPath} className="analytics-line-path" />
              {chartPoints.map((point) => (
                <g key={`day-point-${point.day}`}>
                  <text
                    x={point.x}
                    y={point.y < chartPaddingY + 18 ? point.y + 16 : point.y - 10}
                    className="analytics-line-value"
                  >
                    {point.views}
                  </text>
                  <circle cx={point.x} cy={point.y} r={4} className="analytics-line-dot" />
                  <text x={point.x} y={chartHeight - 4} className="analytics-line-label">
                    {point.day.slice(5)}
                  </text>
                </g>
              ))}
            </svg>
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
