import { buildIconSvg, getIconById } from "@/lib/icon-library";

const colorTokenRegex = /\{\{(blue|green|orange|red|purple)\|([\s\S]*?)\}\}/g;
const iconTokenRegex = /\{\{icon:([a-z0-9-]+)(?::(blue|green|orange|red|purple))?\}\}/g;

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const applyColorTokens = (markdown: string): string => {
  const withIcons = markdown.replace(iconTokenRegex, (_, iconId: string, color: string | undefined) => {
    const icon = getIconById(iconId);
    if (!icon) {
      return escapeHtml(`{{icon:${iconId}${color ? `:${color}` : ""}}}`);
    }

    const classes = color ? `md-inline-icon md-icon-color-${color}` : "md-inline-icon";
    return buildIconSvg(icon, classes, icon.label);
  });

  return withIcons.replace(colorTokenRegex, (_, color: string, content: string) => {
    const safe = escapeHtml(content);
    return `<span class="md-color-${color}">${safe}</span>`;
  });
};
