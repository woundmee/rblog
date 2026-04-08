import Link from "next/link";

export type AdminTabKey = "new" | "published" | "resources" | "about" | "analytics" | "ads";

const adminTabs: Array<{ key: AdminTabKey; href: string; label: string }> = [
  { key: "new", href: "/admin/new", label: "Главная" },
  { key: "published", href: "/admin/published", label: "Опубликованные" },
  { key: "resources", href: "/admin/resources", label: "Ресурсы" },
  { key: "about", href: "/admin/about", label: "Обо мне" },
  { key: "analytics", href: "/admin/analytics", label: "Аналитика" },
  { key: "ads", href: "/admin/ads", label: "Реклама" }
];

type AdminTabsProps = {
  active: AdminTabKey;
};

export default function AdminTabs({ active }: AdminTabsProps) {
  return (
    <section className="panel admin-tabs">
      {adminTabs.map((tab) => (
        <Link key={tab.key} href={tab.href} className={`admin-tab${tab.key === active ? " active" : ""}`}>
          {tab.label}
        </Link>
      ))}
    </section>
  );
}
