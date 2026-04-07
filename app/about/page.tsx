import MarkdownRenderer from "@/components/markdown-renderer";
import { getAboutContent } from "@/lib/site-content";

export default async function AboutPage() {
  const aboutContent = await getAboutContent();

  return (
    <section className="content-stack">
      <article className="panel">
        <header className="section-head">
          <h1>{aboutContent.aboutTitle}</h1>
        </header>
        <MarkdownRenderer markdown={aboutContent.about} className="markdown-body about-markdown" />
      </article>

      <article className="panel about-card">
        <h2>{aboutContent.whoIAmTitle}</h2>
        <MarkdownRenderer markdown={aboutContent.whoIAm} className="markdown-body about-markdown" />
      </article>
    </section>
  );
}
