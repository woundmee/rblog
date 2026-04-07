import type { Metadata } from "next";
import ResourcesInfiniteGrid from "@/components/resources-infinite-grid";
import { getResourcesPage } from "@/lib/resources";
import { toAbsoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Ресурсы",
  description: "Подборка полезных IT-ресурсов: репозитории, сайты, каналы и инструменты.",
  alternates: {
    canonical: toAbsoluteUrl("/resources")
  },
  openGraph: {
    type: "website",
    title: "Ресурсы | rblog",
    description: "Подборка полезных IT-ресурсов: репозитории, сайты, каналы и инструменты.",
    url: toAbsoluteUrl("/resources"),
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Ресурсы rblog"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Ресурсы | rblog",
    description: "Подборка полезных IT-ресурсов: репозитории, сайты, каналы и инструменты.",
    images: ["/twitter-image"]
  }
};

export default async function ResourcesPage() {
  const pageSize = 40;
  const resourcesPage = await getResourcesPage({
    page: 1,
    pageSize
  });

  return (
    <section className="content-stack">
      <header className="content-header">
        <h1>Ресурсы</h1>
        <p>Полезные ссылки: репозитории, сайты, каналы и инструменты.</p>
      </header>

      <ResourcesInfiniteGrid
        initialItems={resourcesPage.items}
        initialPage={resourcesPage.page}
        pageSize={resourcesPage.pageSize}
        initialHasMore={resourcesPage.hasMore}
        emptyMessage="Пока нет ресурсов. Добавь карточки через админ-панель."
      />
    </section>
  );
}
