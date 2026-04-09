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
  const [showFormatting, setShowFormatting] = useState(false);
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

          <div className="editor-tools-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowFormatting((value) => !value)}
              aria-expanded={showFormatting}
            >
              Форматирование
            </button>
          </div>

          {showFormatting && (
            <section className="panel formatting-panel">
              <div className="formatting-quick-actions">
                <button type="button" className="color-btn" onClick={() => wrapSelection("**")}>
                  Bold
                </button>
                <button type="button" className="color-btn" onClick={() => wrapSelection("*")}>
                  Italic
                </button>
                <button type="button" className="color-btn" onClick={() => wrapSelection("<u>", "</u>")}>
                  Underline
                </button>
                <button type="button" className="color-btn" onClick={() => wrapSelection("[", "](https://example.com)")}>
                  Link
                </button>
                <button type="button" className="color-btn" onClick={() => insertSnippet("###### Заголовок\nТекст рекламы\n")}>
                  Template
                </button>
              </div>
              <div className="color-toolbar">
                {colorOptions.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className={`color-btn color-${color.id}`}
                    onClick={() => applyColor(color.id)}
                  >
                    {color.label}
                  </button>
                ))}
              </div>
            </section>
          )}

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
        <div className="about-preview-stack">
          <section className="about-preview-item">
            <h3>Блок под navbar</h3>
            {enabled ? (
              <MarkdownRenderer
                markdown={markdown.trim().length > 0 ? normalizeMarkdownLinks(markdown) : "_Пусто_"}
                className="markdown-body ad-preview-markdown"
              />
            ) : (
              <p className="section-note">Скрыт (не показывается на сайте).</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
