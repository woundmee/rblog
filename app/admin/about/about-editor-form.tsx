"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import IconPicker from "@/components/icon-picker";
import MarkdownRenderer from "@/components/markdown-renderer";

const colorOptions = [
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "orange", label: "Orange" },
  { id: "red", label: "Red" },
  { id: "purple", label: "Purple" }
] as const;

type ColorId = (typeof colorOptions)[number]["id"];
type ActiveField = "about" | "who";

type AboutEditorFormProps = {
  initialAboutTitle: string;
  initialWhoIAmTitle: string;
  initialAbout: string;
  initialWhoIAm: string;
};

export default function AboutEditorForm({
  initialAboutTitle,
  initialWhoIAmTitle,
  initialAbout,
  initialWhoIAm
}: AboutEditorFormProps) {
  const [aboutTitle, setAboutTitle] = useState(initialAboutTitle);
  const [whoIAmTitle, setWhoIAmTitle] = useState(initialWhoIAmTitle);
  const [about, setAbout] = useState(initialAbout);
  const [whoIAm, setWhoIAm] = useState(initialWhoIAm);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>("about");
  const [showIcons, setShowIcons] = useState(false);
  const aboutRef = useRef<HTMLTextAreaElement>(null);
  const whoRef = useRef<HTMLTextAreaElement>(null);

  const getActiveRef = () => (activeField === "about" ? aboutRef.current : whoRef.current);
  const getActiveValue = () => (activeField === "about" ? about : whoIAm);
  const setActiveValue = (value: string) => {
    if (activeField === "about") {
      setAbout(value);
    } else {
      setWhoIAm(value);
    }
  };

  const wrapSelection = (prefix: string, suffix?: string) => {
    const element = getActiveRef();
    if (!element) {
      return;
    }
    const source = getActiveValue();
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = source.slice(start, end) || "текст";
    const right = suffix ?? prefix;
    const next = `${source.slice(0, start)}${prefix}${selected}${right}${source.slice(end)}`;
    setActiveValue(next);

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
    const element = getActiveRef();
    if (!element) {
      return;
    }
    const source = getActiveValue();
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const inserted = asBlock ? normalizeBlockSnippet(source, start, end, snippet) : snippet;
    const next = `${source.slice(0, start)}${inserted}${source.slice(end)}`;
    setActiveValue(next);

    requestAnimationFrame(() => {
      element.focus();
      const caret = start + inserted.length;
      element.setSelectionRange(caret, caret);
    });
  };

  const applyColor = (color: ColorId) => {
    wrapSelection(`{{${color}|`, "}}");
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, field: ActiveField) => {
    setActiveField(field);
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
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aboutTitle, whoIAmTitle, about, whoIAm })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Ошибка сохранения.");
        return;
      }
      setMessage("Раздел 'Обо мне' сохранен.");
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
          <h1>Редактор раздела "Обо мне"</h1>
          <p>Редактируй заголовки и содержание блоков в Markdown-режиме с цветами и иконками.</p>
        </header>

        <form className="editor-form" onSubmit={onSubmit}>
          <div className="editor-tools-row">
            <label className="field compact-field">
              <span>Заголовок блока 1</span>
              <input
                value={aboutTitle}
                onChange={(event) => setAboutTitle(event.target.value)}
                placeholder="About"
                required
              />
            </label>
            <label className="field compact-field">
              <span>Заголовок блока 2</span>
              <input
                value={whoIAmTitle}
                onChange={(event) => setWhoIAmTitle(event.target.value)}
                placeholder="Кто я"
                required
              />
            </label>
          </div>

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

          {showIcons && <IconPicker onInsert={insertSnippet} className="panel icon-picker-panel-inline" />}

          <label className="field">
            <span>{aboutTitle.trim() || "About"}</span>
            <textarea
              ref={aboutRef}
              value={about}
              onChange={(event) => setAbout(event.target.value)}
              onFocus={() => setActiveField("about")}
              onKeyDown={(event) => onEditorKeyDown(event, "about")}
              placeholder="Коротко о блоге и о чем здесь публикации."
              required
            />
          </label>

          <label className="field">
            <span>{whoIAmTitle.trim() || "Кто я"}</span>
            <textarea
              ref={whoRef}
              value={whoIAm}
              onChange={(event) => setWhoIAm(event.target.value)}
              onFocus={() => setActiveField("who")}
              onKeyDown={(event) => onEditorKeyDown(event, "who")}
              placeholder="Опиши себя, опыт, специализацию и роль."
              required
            />
          </label>

          <div className="actions">
            <button className="btn-primary" type="submit" disabled={pending}>
              {pending ? "Сохранение..." : "Сохранить раздел"}
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
            <h3>{aboutTitle.trim() || "About"}</h3>
            <MarkdownRenderer markdown={about.trim().length > 0 ? about : "_Пусто_"} className="markdown-body" />
          </section>
          <section className="about-preview-item">
            <h3>{whoIAmTitle.trim() || "Кто я"}</h3>
            <MarkdownRenderer markdown={whoIAm.trim().length > 0 ? whoIAm : "_Пусто_"} className="markdown-body" />
          </section>
        </div>
      </section>
    </div>
  );
}
