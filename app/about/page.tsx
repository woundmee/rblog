import MarkdownRenderer from "@/components/markdown-renderer";
import { getAboutContent } from "@/lib/site-content";

export default async function AboutPage() {
  const aboutContent = await getAboutContent();

  return (
    <section className="content-stack">
      <article className="panel">
        <header className="section-head">
          <h1>About</h1>
          <p>Информация об авторе и о том, чем полезен этот блог.</p>
        </header>
        <MarkdownRenderer markdown={aboutContent.about} className="markdown-body about-markdown" />
      </article>

      <article className="panel about-card">
        <h2>Кто я</h2>
        <MarkdownRenderer markdown={aboutContent.whoIAm} className="markdown-body about-markdown" />
      </article>
    </section>
  );
}
