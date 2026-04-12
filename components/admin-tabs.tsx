import Link from "next/link";
import type { ReactNode } from "react";

export type AdminTabKey = "new" | "published" | "resources" | "about" | "analytics" | "ads" | "media";

const adminTabs: Array<{ key: AdminTabKey; href: string; label: string; icon?: ReactNode; iconOnly?: boolean }> = [
  { key: "new", href: "/admin/new", label: "Главная" },
  { key: "published", href: "/admin/published", label: "Опубликованные" },
  { key: "resources", href: "/admin/resources", label: "Ресурсы" },
  { key: "about", href: "/admin/about", label: "Обо мне" },
  {
    key: "analytics",
    href: "/admin/analytics",
    label: "Аналитика",
    iconOnly: true,
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden className="bi-bar-chart-line-fill">
        <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1z" />
      </svg>
    )
  },
  {
    key: "ads",
    href: "/admin/ads",
    label: "Реклама",
    iconOnly: true,
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden className="bi-badge-ad-fill">
        <path d="M11.35 8.337c0-.699-.42-1.138-1.001-1.138-.584 0-.954.444-.954 1.239v.453c0 .8.374 1.248.972 1.248.588 0 .984-.44.984-1.2zm-5.413.237-.734-2.426H5.15l-.734 2.426h1.52z" />
        <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm6.209 6.32c0-1.28.694-2.044 1.753-2.044.655 0 1.156.294 1.336.769h.053v-2.36h1.16V11h-1.138v-.747h-.057c-.145.474-.69.804-1.367.804-1.055 0-1.74-.764-1.74-2.043v-.695zm-4.04 1.138L3.7 11H2.5l2.013-5.999H5.9L7.905 11H6.644l-.47-1.542H4.17z" />
      </svg>
    )
  },
  {
    key: "media",
    href: "/admin/media",
    label: "Изображения",
    iconOnly: true,
    icon: (
      <svg viewBox="0 0 16 16" aria-hidden className="bi-gear-wide-connected">
        <path d="M7.068.727c.243-.97 1.62-.97 1.864 0l.071.286a.96.96 0 0 0 1.622.434l.205-.211c.695-.719 1.888-.03 1.613.931l-.08.284a.96.96 0 0 0 1.187 1.187l.283-.081c.96-.275 1.65.918.931 1.613l-.211.205a.96.96 0 0 0 .434 1.622l.286.071c.97.243.97 1.62 0 1.864l-.286.071a.96.96 0 0 0-.434 1.622l.211.205c.719.695.03 1.888-.931 1.613l-.284-.08a.96.96 0 0 0-1.187 1.187l.081.283c.275.96-.918 1.65-1.613.931l-.205-.211a.96.96 0 0 0-1.622.434l-.071.286c-.243.97-1.62.97-1.864 0l-.071-.286a.96.96 0 0 0-1.622-.434l-.205.211c-.695.719-1.888.03-1.613-.931l.08-.284a.96.96 0 0 0-1.186-1.187l-.284.081c-.96.275-1.65-.918-.931-1.613l.211-.205a.96.96 0 0 0-.434-1.622l-.286-.071c-.97-.243-.97-1.62 0-1.864l.286-.071a.96.96 0 0 0 .434-1.622l-.211-.205c-.719-.695-.03-1.888.931-1.613l.284.08a.96.96 0 0 0 1.187-1.186l-.081-.284c-.275-.96.918-1.65 1.613-.931l.205.211a.96.96 0 0 0 1.622-.434zM12.973 8.5H8.25l-2.834 3.779A4.998 4.998 0 0 0 12.973 8.5m0-1a4.998 4.998 0 0 0-7.557-3.779l2.834 3.78zM5.048 3.967l-.087.065zm-.431.355A4.98 4.98 0 0 0 3.002 8c0 1.455.622 2.765 1.615 3.678L7.375 8zm.344 7.646.087.065z" />
      </svg>
    )
  }
];

type AdminTabsProps = {
  active: AdminTabKey;
};

export default function AdminTabs({ active }: AdminTabsProps) {
  return (
    <section className="panel admin-tabs">
      {adminTabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`admin-tab${tab.key === active ? " active" : ""}${tab.iconOnly ? " admin-tab-icon" : ""}`}
          aria-label={tab.label}
          title={tab.label}
        >
          {tab.iconOnly ? tab.icon : tab.label}
        </Link>
      ))}
    </section>
  );
}
