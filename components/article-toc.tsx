"use client";

import { type CSSProperties, useState } from "react";
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
      <TocBody items={items} />
    </nav>
  );
}

function TocBody({ items }: { items: MarkdownHeading[] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <header className="article-toc-head">
        <div>
          <h2>Содержание</h2>
        </div>
        <button
          type="button"
          className="article-toc-toggle"
          aria-label={collapsed ? "Развернуть содержание" : "Свернуть содержание"}
          title={collapsed ? "Развернуть" : "Свернуть"}
          onClick={() => setCollapsed((value) => !value)}
        >
          <svg viewBox="0 0 16 16" aria-hidden>
            {collapsed ? <path d="M3.5 6.2L8 10.7l4.5-4.5" /> : <path d="M3.5 9.8L8 5.3l4.5 4.5" />}
          </svg>
        </button>
      </header>

      {!collapsed && (
        <ul className="article-toc-list">
          {items.map((item) => (
            <li
              key={item.id}
              className="article-toc-item"
              style={{ "--toc-depth": String(Math.max(0, item.level - 1)) } as CSSProperties}
            >
              <a href={`#${item.id}`} className="toc-link">
                <span className="toc-text">{item.text}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
