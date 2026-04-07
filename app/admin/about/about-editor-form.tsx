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
  const [showFormatting, setShowFormatting] = useState(false);
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

  const insertSnippet = (snippet: string) => {
    const element = getActiveRef();
    if (!element) {
      return;
    }
    const source = getActiveValue();
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const next = `${source.slice(0, start)}${snippet}${source.slice(end)}`;
    setActiveValue(next);

    requestAnimationFrame(() => {
      element.focus();
      const caret = start + snippet.length;
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
                Работает для активного поля (по фокусу). Хоткеи: <code>Cmd/Ctrl+B</code>, <code>Cmd/Ctrl+I</code>,{" "}
                <code>Cmd/Ctrl+U</code>, <code>Cmd/Ctrl+~</code>, <code>Cmd/Ctrl+K</code>, <code>Cmd/Ctrl+Z</code>.
                Цвет: <code>{"{{green|текст}}"}</code>, иконка: <code>{"{{icon:github}}"}</code>.
              </p>
            </section>
          )}

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
