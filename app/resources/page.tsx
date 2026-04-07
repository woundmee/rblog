import { getAllResources } from "@/lib/resources";
import ResourceCard from "@/components/resource-card";

export default async function ResourcesPage() {
  const resources = await getAllResources();

  return (
    <section className="content-stack">
      <header className="content-header">
        <h1>Ресурсы</h1>
        <p>Полезные ссылки: репозитории, сайты, каналы и инструменты.</p>
      </header>

      {resources.length === 0 ? (
        <article className="panel empty-panel">
          <p>Пока нет ресурсов. Добавь карточки через админ-панель.</p>
        </article>
      ) : (
        <div className="resources-grid">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </section>
  );
}
