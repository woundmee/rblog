"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import IconPicker from "@/components/icon-picker";
import MarkdownRenderer from "@/components/markdown-renderer";

const defaultTemplate = `# Заголовок\n\nКраткое введение.\n\n## Основная мысль\n\n- Пункт 1\n- Пункт 2\n\n\`\`\`ts\nconsole.log("Hello, blog!");\n\`\`\`\n`;

const colorOptions = [
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "orange", label: "Orange" },
  { id: "red", label: "Red" },
  { id: "purple", label: "Purple" }
] as const;

type ColorId = (typeof colorOptions)[number]["id"];

export type EditorInitialPost = {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  markdown: string;
};

type PostEditorFormProps = {
  mode: "create" | "edit";
  initialPost?: EditorInitialPost;
};

export default function PostEditorForm({ mode, initialPost }: PostEditorFormProps) {
  if (mode === "edit" && !initialPost) {
    throw new Error("initialPost is required for edit mode");
  }

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [date, setDate] = useState(initialPost?.date ?? "");
  const [markdown, setMarkdown] = useState(initialPost?.markdown ?? defaultTemplate);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (prefix: string, suffix?: string) => {
    const element = textareaRef.current;
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

  const insertSnippet = (snippet: string) => {
    const element = textareaRef.current;
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

  const applyColor = (color: ColorId) => {
    wrapSelection(`{{${color}|`, "}}");
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
      return;
    }

    if (key === "e") {
      event.preventDefault();
      wrapSelection("`");
      return;
    }

    if (key === "d") {
      event.preventDefault();
      wrapSelection("```ts\n", "\n```");
    }
  };

  const resetCreateForm = () => {
    setTitle("");
    setExcerpt("");
    setDate("");
    setMarkdown(defaultTemplate);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setIsError(false);

    const endpoint = mode === "edit" ? `/api/posts/${initialPost!.id}` : "/api/posts";
    const method = mode === "edit" ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          date,
          markdown
        })
      });

      const data = (await response.json()) as { error?: string; slug?: string };
      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Не удалось сохранить статью.");
        return;
      }

      if (mode === "edit") {
        setMessage(`Сохранено: /posts/${data.slug}`);
      } else {
        setMessage(`Опубликовано: /posts/${data.slug}`);
        resetCreateForm();
      }
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
          <h1>{mode === "edit" ? "Редактирование статьи" : "Новая статья"}</h1>
          <p>Slug генерируется автоматически на основе заголовка при публикации.</p>
        </header>

        <form className="editor-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label className="field">
              <span>Название</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Пишем быстрый API на Next.js"
                required
              />
            </label>
            <label className="field">
              <span>Дата (YYYY-MM-DD)</span>
              <input value={date} onChange={(event) => setDate(event.target.value)} placeholder="2026-04-06" />
            </label>
          </div>

          <label className="field">
            <span>Краткое описание</span>
            <input
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="Короткое описание статьи."
              required
            />
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
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowIcons((value) => !value)}
              aria-expanded={showIcons}
            >
              Иконки
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
                <button type="button" className="color-btn" onClick={() => wrapSelection("~~")}>
                  Strike
                </button>
                <button type="button" className="color-btn" onClick={() => wrapSelection("`")}>
                  Code
                </button>
                <button type="button" className="color-btn" onClick={() => wrapSelection("[", "](https://example.com)")}>
                  Link
                </button>
                <button
                  type="button"
                  className="color-btn"
                  onClick={() => insertSnippet("| Колонка 1 | Колонка 2 |\n| --- | --- |\n| Значение | Значение |\n")}
                >
                  Table
                </button>
                <button type="button" className="color-btn" onClick={() => insertSnippet("> Цитата\n")}>
                  Quote
                </button>
                <button type="button" className="color-btn" onClick={() => insertSnippet("> [!INFO]\n> Текст уведомления\n")}>
                  Info
                </button>
                <button type="button" className="color-btn" onClick={() => insertSnippet("> [!WARN]\n> Текст предупреждения\n")}>
                  Warn
                </button>
                <button
                  type="button"
                  className="color-btn"
                  onClick={() => insertSnippet("> [!DANGER]\n> Текст важного предупреждения\n")}
                >
                  Danger
                </button>
                <button
                  type="button"
                  className="color-btn"
                  onClick={() => insertSnippet("> [!CALLOUT]\n> Дополнительная заметка\n")}
                >
                  Callout
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
              <p className="hint">
                Хоткеи: <code>Cmd/Ctrl+B</code>, <code>Cmd/Ctrl+I</code>, <code>Cmd/Ctrl+U</code>, <code>Cmd/Ctrl+~</code>,
                <code>Cmd/Ctrl+E</code>, <code>Cmd/Ctrl+Z</code> (undo). Цвет: <code>{"{{blue|текст}}"}</code>. Иконка:
                <code>{"{{icon:telegram}}"}</code> или <code>{"{{icon:telegram:blue}}"}</code>. Callout:{" "}
                <code>{"> [!INFO]\n> текст"}</code>.
              </p>
            </section>
          )}

          {showIcons && (
            <IconPicker onInsert={insertSnippet} className="panel icon-picker-panel-inline" />
          )}

          <label className="field">
            <span>Markdown</span>
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              onKeyDown={onEditorKeyDown}
              required
            />
          </label>

          <div className="actions">
            <button className="btn-primary" type="submit" disabled={pending}>
              {pending ? "Сохранение..." : mode === "edit" ? "Сохранить изменения" : "Опубликовать"}
            </button>
            {message && <p className={isError ? "text-error" : "text-success"}>{message}</p>}
          </div>
        </form>
      </section>

      <section className="panel preview-panel preview-panel-bottom">
        <header className="section-head section-head-compact">
          <h2>Live Preview</h2>
        </header>
        <MarkdownRenderer
          markdown={markdown.trim().length > 0 ? markdown : "_Начни писать, и здесь появится превью._"}
          className="markdown-body"
        />
      </section>
    </div>
  );
}
