import MarkdownRenderer from "@/components/markdown-renderer";
import { getAdContent } from "@/lib/site-content";

export default async function AdBanner() {
  const content = await getAdContent();

  if (!content.enabled) {
    return null;
  }

  const markdown = content.markdown.trim().length > 0 ? content.markdown : "###### Партнёрский блок\n";

  return (
    <section className="ad-banner-wrap" aria-label="Рекламный блок">
      <aside className="ad-banner">
        <MarkdownRenderer markdown={markdown} className="markdown-body ad-banner-markdown" />
      </aside>
    </section>
  );
}
