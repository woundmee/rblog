"use client";

import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
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
  const [showFormatting, setShowFormatting] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [slash, setSlash] = useState<{
    start: number;
    end: number;
    query: string;
    selected: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
                  onClick={() => insertSnippet("| Колонка 1 | Колонка 2 |\n| --- | --- |\n| Значение | Значение |\n", true)}
                >
                  Table
                </button>
                <button type="button" className="color-btn" onClick={() => insertSnippet("> Цитата\n", true)}>
                  Quote
                </button>
                <button type="button" className="color-btn" onClick={() => insertSnippet("> [!INFO] Заголовок\n>\n> Текст уведомления\n", true)}>
                  Info
                </button>
                <button type="button" className="color-btn" onClick={() => insertSnippet("> [!WARN] Заголовок\n>\n> Текст предупреждения\n", true)}>
                  Warn
                </button>
                <button
                  type="button"
                  className="color-btn"
                  onClick={() => insertSnippet("> [!DANGER] Заголовок\n>\n> Текст важного предупреждения\n", true)}
                >
                  Danger
                </button>
                <button
                  type="button"
                  className="color-btn"
                  onClick={() => insertSnippet("> [!CALLOUT] Заголовок\n>\n> Дополнительная заметка\n", true)}
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
                <code>Cmd/Ctrl+E</code>, <code>Cmd/Ctrl+Z</code> (undo). Выдели текст и нажми <code>`</code> для inline
                code, либо <code>Shift+`</code> / multiline selection для блока кода. Цвет: <code>{"{{blue|текст}}"}</code>.
                Иконка: <code>{"{{icon:telegram}}"}</code> или <code>{"{{icon:telegram:blue}}"}</code>. Callout:{" "}
                <code>{"> [!INFO] Заголовок\n>\n> текст"}</code>. Slash-команды: начни строку с <code>/</code> и выбери шаблон.
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
