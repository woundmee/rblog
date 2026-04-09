export type MarkdownHeading = {
  level: number;
  text: string;
  id: string;
};

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, " ").trim();

const stripInlineMarkdown = (value: string): string =>
  normalizeSpaces(
    value
      .replace(/!\[[^\]]*?\]\((.*?)\)/g, "")
      .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/\{\{(blue|green|orange|red|purple)\|([\s\S]*?)\}\}/g, "$2")
      .replace(/\{\{icon:[a-z0-9-]+(?::(blue|green|orange|red|purple))?\}\}/g, "")
  );

export const slugifyHeading = (value: string): string => {
  const normalized = value
    .toLocaleLowerCase("ru-RU")
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "section";
};

export const buildHeadingId = (text: string, line?: number): string => {
  const base = slugifyHeading(text);
  if (!line || line < 1) {
    return base;
  }
  return `${base}-${line}`;
};

export const extractMarkdownHeadings = (markdown: string): MarkdownHeading[] => {
  const rows = markdown.replace(/\r/g, "").split("\n");
  const headings: MarkdownHeading[] = [];
  let inFence = false;
  let fenceMarker = "";

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const fence = row.match(/^(\s*)(`{3,}|~{3,})/);
    if (fence) {
      const marker = fence[2];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0];
      } else if (marker[0] === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }
      continue;
    }

    if (inFence) {
      continue;
    }

    const match = row.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const text = stripInlineMarkdown(match[2]);
    if (!text) {
      continue;
    }

    const id = buildHeadingId(text, index + 1);
    headings.push({ level, text, id });
  }

  return headings;
};
