"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import MarkdownRenderer from "@/components/markdown-renderer";
import { normalizeMarkdownLinks } from "@/lib/markdown";

const colorOptions = [
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "orange", label: "Orange" },
  { id: "red", label: "Red" },
  { id: "purple", label: "Purple" }
] as const;

type ColorId = (typeof colorOptions)[number]["id"];

type AdsEditorFormProps = {
  initialEnabled: boolean;
  initialMarkdown: string;
};

export default function AdsEditorForm({ initialEnabled, initialMarkdown }: AdsEditorFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (prefix: string, suffix?: string) => {
    const element = editorRef.current;
    if (!element) {
      return;
    }
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = markdown.slice(start, end) || "текст";
    const right = suffix ?? prefix;
    const next = `${markdown.slice(0, start)}${prefix}${selected}${right}${markdown.slice(end)}`;
    setMarkdown(next);

    requestAnimationFrame(() => {
      element.focus();
      const selectionStart = start + prefix.length;
      const selectionEnd = selectionStart + selected.length;
      element.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const applyColor = (color: ColorId) => {
    wrapSelection(`{{${color}|`, "}}");
  };

  const insertSnippet = (snippet: string) => {
    const element = editorRef.current;
    if (!element) {
      return;
    }
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const next = `${markdown.slice(0, start)}${snippet}${markdown.slice(end)}`;
    setMarkdown(next);

    requestAnimationFrame(() => {
      element.focus();
      const caret = start + snippet.length;
      element.setSelectionRange(caret, caret);
    });
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const meta = event.metaKey || event.ctrlKey;
    if (!meta) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === "z") {
      return;
    }
    if (key === "b") {
      event.preventDefault();
      wrapSelection("**");
      return;
    }
    if (key === "i") {
      event.preventDefault();
      wrapSelection("*");
      return;
    }
    if (key === "u") {
      event.preventDefault();
      wrapSelection("<u>", "</u>");
      return;
    }
    if (key === "~" || key === "`") {
      event.preventDefault();
      wrapSelection("~~");
      return;
    }
    if (key === "k") {
      event.preventDefault();
      wrapSelection("[", "](https://example.com)");
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setIsError(false);

    const normalizedMarkdown = normalizeMarkdownLinks(markdown);

    try {
      const response = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, markdown: normalizedMarkdown })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Ошибка сохранения.");
        return;
      }
      setMessage("Настройки рекламного блока сохранены.");
    } catch {
      setIsError(true);
      setMessage("Ошибка сети. Повтори попытку.");
    } finally {
      setPending(false);
    }
  };

  const previewMarkdown = markdown.trim().length > 0 ? normalizeMarkdownLinks(markdown) : "_Пусто_";

  return (
    <div className="editor-grid editor-grid-single">
      <section className="panel editor-panel">
        <header className="section-head">
          <h1>Реклама под navbar</h1>
          <p>Неброский блок под навигацией. По умолчанию скрыт, включается вручную.</p>
        </header>

        <form className="editor-form" onSubmit={onSubmit}>
          <label className="ad-toggle">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            <span>Показывать рекламный блок</span>
          </label>

          <section className="panel formatting-panel" aria-label="Форматирование">
            <div className="comment-toolbar admin-markdown-toolbar">
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => wrapSelection("**")} aria-label="Жирный" title="Жирный">
                <strong>B</strong>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => wrapSelection("*")} aria-label="Курсив" title="Курсив">
                <em>I</em>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => wrapSelection("<u>", "</u>")} aria-label="Подчеркнутый" title="Подчеркнутый">
                <span className="comment-tool-underline">U</span>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => wrapSelection("~~")} aria-label="Зачеркнутый" title="Зачеркнутый">
                <span className="comment-tool-strike">S</span>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => wrapSelection("`")} aria-label="Встроенный код" title="Встроенный код">
                <span className="comment-tool-code">&lt;/&gt;</span>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => wrapSelection("```ts\n", "\n```")} aria-label="Блок кода" title="Блок кода">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M1.5 3.5h13M1.5 8h13M1.5 12.5h13" />
                  <path d="M5.2 3.5v9M10.8 3.5v9" />
                </svg>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => wrapSelection("[", "](https://example.com)")} aria-label="Ссылка" title="Ссылка">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M6.2 9.8l3.6-3.6" />
                  <path d="M5 11L3.9 12a2.3 2.3 0 01-3.2-3.2L1.8 7.7" />
                  <path d="M11 5l1.1-1.1a2.3 2.3 0 113.2 3.2L14.2 8.2" />
                </svg>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => insertSnippet("###### Заголовок\nТекст рекламы\n")} aria-label="Шаблон" title="Шаблон">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2.5 3.5h11M2.5 7h11M2.5 10.5h7.2M2.5 13h5.2" />
                </svg>
              </button>
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={`comment-tool-btn comment-tool-icon comment-color-btn color-${color.id}`}
                  onClick={() => applyColor(color.id)}
                  aria-label={`Цвет: ${color.label}`}
                  title={`Цвет: ${color.label}`}
                >
                  <span className="comment-color-dot" />
                </button>
              ))}
            </div>
          </section>

          <label className="field">
            <span>Markdown (рекомендуется: короткий заголовок + одна строка текста)</span>
            <textarea
              ref={editorRef}
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              onKeyDown={onEditorKeyDown}
              placeholder={"###### Партнёрский блок\nКороткий рекламный текст без навязчивости."}
            />
          </label>

          <div className="actions">
            <button className="btn-primary" type="submit" disabled={pending}>
              {pending ? "Сохранение..." : "Сохранить рекламу"}
            </button>
            {message && <p className={isError ? "text-error" : "text-success"}>{message}</p>}
          </div>
        </form>
      </section>

      <section className="panel preview-panel preview-panel-bottom">
        <header className="section-head section-head-compact">
          <h2>Превью</h2>
        </header>
        {enabled ? (
          <aside className="ad-banner ad-preview-banner">
            <MarkdownRenderer markdown={previewMarkdown} className="markdown-body ad-banner-markdown ad-preview-markdown" />
          </aside>
        ) : (
          <p className="section-note">Скрыт (не показывается на сайте).</p>
        )}
      </section>
    </div>
  );
}
