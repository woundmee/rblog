import type { MarkdownHeading } from "@/lib/markdown-headings";

type ArticleTocProps = {
  items: MarkdownHeading[];
};

export default function ArticleToc({ items }: ArticleTocProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="article-toc" aria-label="Содержание">
      <h2>Содержание</h2>
      <ol>
        {items.map((item) => {
          return (
            <li key={item.id} className={`toc-level-${item.level}`}>
              <a href={`#${item.id}`}>
                <span className="toc-prefix" aria-hidden>
                  -
                </span>
                <span>{item.text}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
