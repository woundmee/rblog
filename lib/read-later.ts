export type FavoritePostItem = {
  kind: "post";
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
};

export type FavoriteResourceItem = {
  kind: "resource";
  id: number;
  url: string;
  title: string;
  excerpt: string;
  date: string;
};

export type ReadLaterItem = FavoritePostItem | FavoriteResourceItem;

export const READ_LATER_STORAGE_KEY = "rblog_read_later";
export const READ_LATER_UPDATED_EVENT = "rblog:read-later-updated";

export const readLaterItemKey = (item: ReadLaterItem): string => `${item.kind}:${item.id}`;

export const readLaterLoadItems = (): ReadLaterItem[] => {
  try {
    const raw = window.localStorage.getItem(READ_LATER_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const nowDate = new Date().toISOString().slice(0, 10);
    const items = parsed
      .map((item) => item as Partial<ReadLaterItem> & { kind?: string; slug?: string; url?: string })
      .map((item): ReadLaterItem | null => {
        if (typeof item.id !== "number" || typeof item.title !== "string") {
          return null;
        }

        const excerpt = typeof item.excerpt === "string" ? item.excerpt : "";
        const date = typeof item.date === "string" ? item.date : nowDate;

        if (item.kind === "resource") {
          if (typeof item.url !== "string" || item.url.length === 0) {
            return null;
          }
          return {
            kind: "resource",
            id: item.id,
            url: item.url,
            title: item.title,
            excerpt,
            date
          };
        }

        // Migration path for legacy entries without `kind`.
        if (typeof item.slug !== "string" || item.slug.length === 0) {
          return null;
        }
        return {
          kind: "post",
          id: item.id,
          slug: item.slug,
          title: item.title,
          excerpt,
          date
        };
      })
      .filter((item): item is ReadLaterItem => Boolean(item));

    const seen = new Set<string>();
    return items.filter((item) => {
      const key = readLaterItemKey(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  } catch {
    return [];
  }
};

export const readLaterSaveItems = (items: ReadLaterItem[]) => {
  window.localStorage.setItem(READ_LATER_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(READ_LATER_UPDATED_EVENT));
};
