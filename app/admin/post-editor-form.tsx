"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
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

type SlashCommand = {
  id: string;
  label: string;
  hint: string;
  snippet: string;
  block?: boolean;
};

const slashCommands: SlashCommand[] = [
  { id: "h2", label: "H2", hint: "Заголовок раздела", snippet: "## Заголовок раздела\n", block: true },
  { id: "h3", label: "H3", hint: "Подраздел", snippet: "### Подраздел\n", block: true },
  { id: "code", label: "Code", hint: "Блок кода TypeScript", snippet: "```ts\nconst value = true;\n```\n", block: true },
  { id: "table", label: "Table", hint: "Markdown-таблица", snippet: "| Колонка 1 | Колонка 2 |\n| --- | --- |\n| Значение | Значение |\n", block: true },
  { id: "quote", label: "Quote", hint: "Цитата", snippet: "> Цитата\n", block: true },
  { id: "qoute", label: "Quote", hint: "Цитата (alias)", snippet: "> Цитата\n", block: true },
  { id: "info", label: "Info", hint: "Информационный callout", snippet: "> [!INFO] Заголовок\n>\n> Текст уведомления\n", block: true },
  { id: "warn", label: "Warn", hint: "Предупреждение", snippet: "> [!WARN] Заголовок\n>\n> Текст предупреждения\n", block: true },
  { id: "danger", label: "Danger", hint: "Критичный callout", snippet: "> [!DANGER] Заголовок\n>\n> Текст важного предупреждения\n", block: true },
  { id: "link", label: "Link", hint: "Markdown-ссылка", snippet: "[Текст ссылки](https://example.com)\n" },
  { id: "hr", label: "Divider", hint: "Горизонтальная линия", snippet: "---\n", block: true },
  { id: "todo", label: "Checklist", hint: "Чеклист", snippet: "- [ ] Первый пункт\n- [ ] Второй пункт\n", block: true }
];

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
  const [showIcons, setShowIcons] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState(false);
  const [slash, setSlash] = useState<{
    start: number;
    end: number;
    query: string;
    selected: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const visibleSlashCommands = useMemo(() => {
    if (!slash) {
      return [];
    }
    const query = slash.query.toLocaleLowerCase("ru-RU");
    return slashCommands
      .filter((command) => query.length === 0 || command.id.includes(query) || command.label.toLocaleLowerCase("ru-RU").includes(query))
      .slice(0, 8);
  }, [slash]);

  const detectSlash = (value: string, caretPosition: number) => {
    const beforeCaret = value.slice(0, caretPosition);
    const match = beforeCaret.match(/(^|\s)\/([a-z0-9_-]*)$/i);
    if (!match) {
      return null;
    }
    const tokenLength = 1 + (match[2]?.length ?? 0);
    return {
      start: caretPosition - tokenLength,
      end: caretPosition,
      query: (match[2] ?? "").toLocaleLowerCase("ru-RU")
    };
  };

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

  const normalizeBlockSnippet = (source: string, start: number, end: number, snippet: string): string => {
    const before = source.slice(0, start);
    const after = source.slice(end);
    const base = snippet.replace(/^\n+/, "").replace(/\n+$/, "\n");
    const prefix = start > 0 && !before.endsWith("\n") ? "\n" : "";
    const suffix = after.length > 0 && !after.startsWith("\n") ? "\n" : "";
    return `${prefix}${base}${suffix}`;
  };

  const insertSnippet = (snippet: string, asBlock = false) => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const inserted = asBlock ? normalizeBlockSnippet(markdown, start, end, snippet) : snippet;
    const next = `${markdown.slice(0, start)}${inserted}${markdown.slice(end)}`;
    setMarkdown(next);

    requestAnimationFrame(() => {
      element.focus();
      const caret = start + inserted.length;
      element.setSelectionRange(caret, caret);
    });
  };

  const applyColor = (color: ColorId) => {
    wrapSelection(`{{${color}|`, "}}");
  };

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const formatAltText = (fileName: string): string => {
    const base = fileName.replace(/\.[^.]+$/, "").trim();
    const normalized = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return normalized.length > 0 ? normalized : "image";
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadMessage("");
    setUploadError(false);
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/uploads/images", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !data.url) {
        setUploadError(true);
        setUploadMessage(data.error ?? "Не удалось загрузить изображение.");
        return;
      }

      const alt = formatAltText(file.name);
      insertSnippet(`![${alt}](${data.url})\n`, true);
      setUploadMessage("Изображение загружено. Размер: [alt|640](link) или ![alt|640](link).");
    } catch {
      setUploadError(true);
      setUploadMessage("Ошибка сети при загрузке изображения.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const applySlashCommand = (command: SlashCommand) => {
    if (!slash) {
      return;
    }
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    const inserted = command.block
      ? normalizeBlockSnippet(markdown, slash.start, slash.end, command.snippet)
      : command.snippet;
    const next = `${markdown.slice(0, slash.start)}${inserted}${markdown.slice(slash.end)}`;
    const caret = slash.start + inserted.length;
    setMarkdown(next);
    setSlash(null);

    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(caret, caret);
    });
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const element = textareaRef.current;
    const hasSelection = element ? element.selectionStart !== element.selectionEnd : false;

    if (slash && visibleSlashCommands.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlash((current) =>
          current
            ? {
                ...current,
                selected: (current.selected + 1) % visibleSlashCommands.length
              }
            : current
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlash((current) =>
          current
            ? {
                ...current,
                selected: (current.selected - 1 + visibleSlashCommands.length) % visibleSlashCommands.length
              }
            : current
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const command = visibleSlashCommands[Math.min(slash.selected, visibleSlashCommands.length - 1)];
        if (command) {
          applySlashCommand(command);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSlash(null);
        return;
      }
    }

    if (event.code === "Backquote" && !event.metaKey && !event.ctrlKey && !event.altKey && hasSelection) {
      event.preventDefault();
      const selected = markdown.slice(element!.selectionStart, element!.selectionEnd);
      if (event.shiftKey || selected.includes("\n")) {
        wrapSelection("```ts\n", "\n```");
      } else {
        wrapSelection("`");
      }
      return;
    }

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
    setSlash(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSlash(null);
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

          {uploadMessage && <p className={uploadError ? "text-error" : "text-success"}>{uploadMessage}</p>}

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
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => insertSnippet("| Колонка 1 | Колонка 2 |\n| --- | --- |\n| Значение | Значение |\n", true)} aria-label="Таблица" title="Таблица">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                  <path d="M1.5 6.5h13M1.5 10h13M6 2.5v11M10 2.5v11" />
                </svg>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => insertSnippet("> Цитата\n", true)} aria-label="Цитата" title="Цитата">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 4h4v4H3zM9 4h4v4H9z" />
                  <path d="M4 8v2.4C4 11.8 3.1 13 1.8 13M10 8v2.4c0 1.4-.9 2.6-2.2 2.6" />
                </svg>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => insertSnippet("> [!INFO] Заголовок\n>\n> Текст уведомления\n", true)} aria-label="Info callout" title="Info callout">
                <span className="admin-tool-badge">i</span>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => insertSnippet("> [!WARN] Заголовок\n>\n> Текст предупреждения\n", true)} aria-label="Warn callout" title="Warn callout">
                <span className="admin-tool-badge">!</span>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => insertSnippet("> [!DANGER] Заголовок\n>\n> Текст важного предупреждения\n", true)} aria-label="Danger callout" title="Danger callout">
                <span className="admin-tool-badge">x</span>
              </button>
              <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => insertSnippet("> [!CALLOUT] Заголовок\n>\n> Дополнительная заметка\n", true)} aria-label="Callout" title="Callout">
                <span className="admin-tool-badge">*</span>
              </button>
              <button
                type="button"
                className="comment-tool-btn comment-tool-icon"
                onClick={() => setShowIcons((value) => !value)}
                aria-expanded={showIcons}
                aria-label="Панель иконок"
                title="Панель иконок"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="5.5" />
                  <circle cx="6.1" cy="6.8" r="0.55" />
                  <circle cx="9.9" cy="6.8" r="0.55" />
                  <path d="M5.6 9.7c.5.8 1.4 1.3 2.4 1.3s1.9-.5 2.4-1.3" />
                </svg>
              </button>
              <button
                type="button"
                className="comment-tool-btn comment-tool-icon"
                onClick={openImagePicker}
                disabled={isUploadingImage}
                aria-label={isUploadingImage ? "Загрузка изображения" : "Загрузить изображение"}
                title={isUploadingImage ? "Загрузка изображения" : "Загрузить изображение"}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="2" y="3" width="12" height="10" rx="1.5" />
                  <path d="M3.9 10.2L6.1 7.9l2 2 1.6-1.6 2.4 2.4" />
                  <circle cx="6" cy="6.1" r="0.7" />
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
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden-file-input" onChange={uploadImage} />
          </section>

          {showIcons && (
            <IconPicker onInsert={insertSnippet} className="panel icon-picker-panel-inline" />
          )}

          <label className="field">
            <span>Markdown</span>
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(event) => {
                  const value = event.target.value;
                  const caret = event.target.selectionStart ?? value.length;
                  setMarkdown(value);
                  const detected = detectSlash(value, caret);
                  if (!detected) {
                    setSlash(null);
                    return;
                  }
                  setSlash((current) => ({
                    ...detected,
                    selected: current && current.query === detected.query ? current.selected : 0
                  }));
                }}
                onKeyDown={onEditorKeyDown}
                onBlur={() => {
                  window.setTimeout(() => setSlash(null), 120);
                }}
                required
              />
            </label>

          {slash && visibleSlashCommands.length > 0 && (
            <div className="slash-menu panel" role="listbox" aria-label="Slash команды">
              {visibleSlashCommands.map((command, index) => (
                <button
                  key={command.id}
                  type="button"
                  className={`slash-item${index === slash.selected ? " active" : ""}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applySlashCommand(command)}
                >
                  <strong>/{command.id}</strong>
                  <span>{command.hint}</span>
                </button>
              ))}
            </div>
          )}

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
