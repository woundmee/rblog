export type ReadLaterItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
};

export const READ_LATER_STORAGE_KEY = "rblog_read_later";
export const READ_LATER_UPDATED_EVENT = "rblog:read-later-updated";

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
    return parsed
      .map((item) => item as Partial<ReadLaterItem>)
      .filter((item) => typeof item.id === "number" && typeof item.slug === "string" && typeof item.title === "string")
      .map((item) => ({
        id: item.id as number,
        slug: item.slug as string,
        title: item.title as string,
        excerpt: typeof item.excerpt === "string" ? item.excerpt : "",
        date: typeof item.date === "string" ? item.date : new Date().toISOString().slice(0, 10)
      }));
  } catch {
    return [];
  }
};

export const readLaterSaveItems = (items: ReadLaterItem[]) => {
  window.localStorage.setItem(READ_LATER_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(READ_LATER_UPDATED_EVENT));
};
