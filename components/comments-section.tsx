"use client";

import { FormEvent, KeyboardEvent, type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import MarkdownRenderer from "@/components/markdown-renderer";

type CommentItem = {
  id: number;
  postId: number;
  parentId: number | null;
  visitorId: string;
  authorLabel: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type CommentsSectionProps = {
  postId: number;
};

type CommentsResponse = {
  comments?: CommentItem[];
  me?: string;
  error?: string;
  retryAfterSeconds?: number;
};

const colorOptions = [
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "orange", label: "Orange" },
  { id: "red", label: "Red" },
  { id: "purple", label: "Purple" }
] as const;

type ColorId = (typeof colorOptions)[number]["id"];

const formatCommentDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  });
};

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [me, setMe] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showFormatting, setShowFormatting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const roots = useMemo(() => comments.filter((comment) => comment.parentId == null), [comments]);
  const byParent = useMemo(() => {
    const map = new Map<number, CommentItem[]>();
    for (const comment of comments) {
      if (comment.parentId == null) {
        continue;
      }
      const current = map.get(comment.parentId) ?? [];
      current.push(comment);
      map.set(comment.parentId, current);
    }
    return map;
  }, [comments]);

  const handleReply = (comment: CommentItem) => {
    setReplyTo(comment);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      textareaRef.current?.focus();
    });
  };

  const renderComment = (comment: CommentItem, depth: number): JSX.Element => {
    const children = byParent.get(comment.id) ?? [];
    const repliesStyle = {
      "--reply-depth": String(depth + 1)
    } as CSSProperties;

    return (
      <article key={comment.id} id={`comment-${comment.id}`} className={`comment-card${depth > 0 ? " comment-card-reply" : ""}`}>
        <header className="comment-head">
          <strong>{comment.authorLabel}</strong>
          <span>{formatCommentDate(comment.createdAt)}</span>
        </header>
        <MarkdownRenderer markdown={comment.content} className="markdown-body comment-markdown" />
        <div className="comment-actions">
          <button type="button" className="btn-secondary" onClick={() => handleReply(comment)}>
            Ответить
          </button>
        </div>

        {children.length > 0 ? <div className="comment-replies" style={repliesStyle}>{children.map((child) => renderComment(child, depth + 1))}</div> : null}
      </article>
    );
  };

  const load = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, { cache: "no-store" });
      const data = (await response.json()) as CommentsResponse;
      if (!response.ok) {
        setError(data.error ?? "Не удалось загрузить комментарии.");
        return;
      }
      setComments(data.comments ?? []);
      setMe(data.me ?? "");
      setError("");
    } catch {
      setError("Ошибка загрузки комментариев.");
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  const wrapSelection = (prefix: string, suffix?: string) => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = content.slice(start, end) || "текст";
    const right = suffix ?? prefix;
    const next = `${content.slice(0, start)}${prefix}${selected}${right}${content.slice(end)}`;

    setContent(next);

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
      setContent((prev) => `${prev}${snippet}`);
      return;
    }

    const start = element.selectionStart;
    const end = element.selectionEnd;
    const inserted = asBlock ? normalizeBlockSnippet(content, start, end, snippet) : snippet;
    const next = `${content.slice(0, start)}${inserted}${content.slice(end)}`;
    setContent(next);

    requestAnimationFrame(() => {
      element.focus();
      const caret = start + inserted.length;
      element.setSelectionRange(caret, caret);
    });
  };

  const applyColor = (color: ColorId) => {
    wrapSelection(`{{${color}|`, "}}");
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.nativeEvent as { isComposing?: boolean }).isComposing) {
      return;
    }
    const element = textareaRef.current;
    const hasSelection = element ? element.selectionStart !== element.selectionEnd : false;

    if (event.code === "Backquote" && !event.metaKey && !event.ctrlKey && !event.altKey && hasSelection) {
      event.preventDefault();
      const selected = content.slice(element!.selectionStart, element!.selectionEnd);
      if (event.shiftKey || selected.includes("\n")) {
        wrapSelection("```ts\n", "\n```");
      } else {
        wrapSelection("`");
      }
      return;
    }

    const meta = event.metaKey || event.ctrlKey;
    if (meta) {
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
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) {
      return;
    }

    const trimmed = content.trim();
    if (trimmed.length < 2) {
      setError("Комментарий слишком короткий.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          parentId: replyTo?.id ?? null
        })
      });

      const data = (await response.json()) as CommentsResponse & { comment?: CommentItem };
      if (!response.ok) {
        if (response.status === 429 && data.retryAfterSeconds) {
          setError(`Слишком часто. Попробуй через ${data.retryAfterSeconds} сек.`);
        } else {
          setError(data.error ?? "Не удалось отправить комментарий.");
        }
        return;
      }

      if (data.comment) {
        setComments((prev) => [...prev, data.comment!]);
      } else {
        await load();
      }
      setContent("");
      setReplyTo(null);
    } catch {
      setError("Ошибка сети. Повтори попытку.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="comments-section">
      <header className="section-head section-head-compact comments-head">
        <h2>Комментарии</h2>
        <p className="comments-total">{comments.length}</p>
      </header>

      <p className="section-note">Ты: {me || "..."}</p>

      <form ref={formRef} className="comment-form" onSubmit={onSubmit}>
        {replyTo && (
          <div className="comment-replying">
            <span>
              Ответ для: <strong>{replyTo.authorLabel}</strong>
            </span>
            <button type="button" className="btn-secondary" onClick={() => setReplyTo(null)}>
              Отменить
            </button>
          </div>
        )}
        <div className="comment-form-top">
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
          <section className="comment-formatting-panel">
            <div className="comment-toolbar">
              <button type="button" className="comment-tool-btn" onClick={() => wrapSelection("**")}>
                Bold
              </button>
              <button type="button" className="comment-tool-btn" onClick={() => wrapSelection("*")}>
                Italic
              </button>
              <button type="button" className="comment-tool-btn" onClick={() => wrapSelection("<u>", "</u>")}>
                Underline
              </button>
              <button type="button" className="comment-tool-btn" onClick={() => wrapSelection("~~")}>
                Strike
              </button>
              <button type="button" className="comment-tool-btn" onClick={() => wrapSelection("`")}>
                Code
              </button>
              <button type="button" className="comment-tool-btn" onClick={() => wrapSelection("```ts\n", "\n```")}>
                Block Code
              </button>
              <button type="button" className="comment-tool-btn" onClick={() => wrapSelection("[", "](https://example.com)")}>
                Link
              </button>
              <button type="button" className="comment-tool-btn" onClick={() => insertSnippet("> Цитата\n", true)}>
                Quote
              </button>
              <button
                type="button"
                className="comment-tool-btn"
                onClick={() => insertSnippet("| Колонка 1 | Колонка 2 |\n| --- | --- |\n| Значение | Значение |\n", true)}
              >
                Table
              </button>
            </div>
            <div className="comment-color-toolbar">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={`comment-tool-btn color-${color.id}`}
                  onClick={() => applyColor(color.id)}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </section>
        )}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={onEditorKeyDown}
          className="comment-input"
          placeholder="Напиши комментарий..."
          maxLength={1200}
          required
        />
        <div className="comment-form-actions">
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "Отправка..." : replyTo ? "Ответить" : "Отправить"}
          </button>
          {error && <p className="text-error">{error}</p>}
        </div>
      </form>

      <div className="comments-list">
        {roots.length === 0 ? (
          <p className="section-note">Пока нет комментариев. Будь первым.</p>
        ) : (
          roots.map((comment) => renderComment(comment, 0))
        )}
      </div>
    </section>
  );
}
