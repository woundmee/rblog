import type { ResourceItem } from "@/lib/resources";
import ResourceFavoriteButton from "@/components/resource-favorite-button";

const truncateDescription = (value: string, limit = 150): string => {
  const normalized = value.trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit).trimEnd()}...`;
};

const getHostLabel = (resourceUrl: string): string => {
  try {
    return new URL(resourceUrl).hostname.replace(/^www\./i, "");
  } catch {
    return resourceUrl;
  }
};

type ResourceCardProps = {
  resource: ResourceItem;
};

export default function ResourceCard({ resource }: ResourceCardProps) {
  const description = truncateDescription(resource.description, 150);
  const hostLabel = getHostLabel(resource.url);

  return (
    <article className="resource-card-shell">
      <a
        href={resource.url}
        target="_blank"
        rel="noreferrer noopener"
        className="resource-card panel"
        aria-label={`Открыть ресурс: ${resource.title}`}
      >
        <div className="resource-cover-wrap">
          {resource.imageUrl ? (
            <img src={resource.imageUrl} alt={resource.title} className="resource-cover" loading="lazy" />
          ) : (
            <div className="resource-cover resource-cover-fallback">{hostLabel}</div>
          )}
        </div>
        <div className="resource-body">
          <h2>{resource.title}</h2>
          <p>{description || "Описание не указано."}</p>
          <span className="resource-link">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6.25 4.75h5v5M10.95 5.05l-5.9 5.9" />
            </svg>
            {hostLabel}
          </span>
        </div>
      </a>

      <div className="resource-favorite-wrap">
        <ResourceFavoriteButton
          resource={{
            id: resource.id,
            title: resource.title,
            url: resource.url,
            description: resource.description
          }}
        />
      </div>
    </article>
  );
}
