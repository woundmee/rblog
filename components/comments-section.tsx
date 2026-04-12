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
  meVisitorId?: string;
  error?: string;
  retryAfterSeconds?: number;
};

const colorOptions = [
  { id: "blue", label: "Синий" },
  { id: "green", label: "Зеленый" },
  { id: "orange", label: "Оранжевый" },
  { id: "red", label: "Красный" },
  { id: "purple", label: "Фиолетовый" }
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
  const [meVisitorId, setMeVisitorId] = useState("");
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingPending, setEditingPending] = useState(false);
  const [editingError, setEditingError] = useState("");
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
    setEditingCommentId(null);
    setEditingContent("");
    setEditingError("");
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      textareaRef.current?.focus();
    });
  };

  const startEditing = (comment: CommentItem) => {
    setReplyTo(null);
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setEditingError("");
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent("");
    setEditingError("");
  };

  const submitEdit = async (commentId: number) => {
    if (editingPending) {
      return;
    }
    const trimmed = editingContent.trim();
    if (trimmed.length < 2) {
      setEditingError("Комментарий слишком короткий.");
      return;
    }

    setEditingPending(true);
    setEditingError("");
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, content: trimmed })
      });
      const data = (await response.json().catch(() => null)) as { comment?: CommentItem; error?: string } | null;

      if (!response.ok) {
        setEditingError(data?.error ?? "Не удалось обновить комментарий.");
        return;
      }

      if (data?.comment) {
        setComments((prev) => prev.map((item) => (item.id === data.comment!.id ? data.comment! : item)));
      }
      cancelEditing();
    } catch {
      setEditingError("Ошибка сети. Повтори попытку.");
    } finally {
      setEditingPending(false);
    }
  };

  const renderComment = (comment: CommentItem, depth: number): JSX.Element => {
    const children = byParent.get(comment.id) ?? [];
    const isOwnComment = meVisitorId.length > 0 && comment.visitorId === meVisitorId;
    const isEditing = editingCommentId === comment.id;
    const depthLevel = Math.min(depth, 6);
    const repliesDepthLevel = Math.min(depth + 1, 6);
    const repliesStyle = {
      "--reply-depth": String(depth + 1)
    } as CSSProperties;

    return (
      <article key={comment.id} id={`comment-${comment.id}`} className={`comment-card comment-depth-${depthLevel}`}>
        <header className="comment-head">
          <strong>{comment.authorLabel}</strong>
          <span>{formatCommentDate(comment.createdAt)}</span>
        </header>
        {isEditing ? (
          <div className="comment-edit-box">
            <textarea
              className="comment-edit-input"
              value={editingContent}
              onChange={(event) => setEditingContent(event.target.value)}
              maxLength={1200}
              autoFocus
            />
            <div className="comment-edit-actions">
              <button type="button" className="btn-primary" disabled={editingPending} onClick={() => void submitEdit(comment.id)}>
                {editingPending ? "Сохранение..." : "Сохранить"}
              </button>
              <button type="button" className="btn-secondary" disabled={editingPending} onClick={cancelEditing}>
                Отменить
              </button>
              {editingError ? <p className="text-error">{editingError}</p> : null}
            </div>
          </div>
        ) : (
          <MarkdownRenderer markdown={comment.content} className="markdown-body comment-markdown" allowRawHtml={false} />
        )}
        <div className="comment-actions">
          <button type="button" className="btn-secondary comment-action-btn" onClick={() => handleReply(comment)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6.2 3.8L2 8l4.2 4.2" />
              <path d="M2.4 8h6.3a5.3 5.3 0 015.3 5.3v.2" />
            </svg>
            Ответить
          </button>
          {isOwnComment && !isEditing ? (
            <button type="button" className="btn-secondary comment-action-btn" onClick={() => startEditing(comment)}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M11.5 2.5l2 2a1 1 0 010 1.4L6 13.4 2.5 14l.6-3.5 7.5-7.5a1 1 0 011.4 0z" />
                <path d="M10.2 3.8l2 2" />
              </svg>
              Редактировать
            </button>
          ) : null}
        </div>

        {children.length > 0 ? (
          <div className={`comment-replies comment-replies-depth-${repliesDepthLevel}`} style={repliesStyle}>
            {children.map((child) => renderComment(child, depth + 1))}
          </div>
        ) : null}
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
      setMeVisitorId(data.meVisitorId ?? "");
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
            <span className="comment-replying-label">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6.2 3.8L2 8l4.2 4.2" />
                <path d="M2.4 8h6.3a5.3 5.3 0 015.3 5.3v.2" />
              </svg>
              <span>
                Ответ для: <strong>{replyTo.authorLabel}</strong>
              </span>
            </span>
            <button type="button" className="btn-secondary" onClick={() => setReplyTo(null)}>
              Отменить
            </button>
          </div>
        )}
        <section className="comment-formatting-panel" aria-label="Форматирование">
          <div className="comment-toolbar">
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
            <button type="button" className="comment-tool-btn comment-tool-icon" onClick={() => insertSnippet("> Цитата\n", true)} aria-label="Цитата" title="Цитата">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 4h4v4H3zM9 4h4v4H9z" />
                <path d="M4 8v2.4C4 11.8 3.1 13 1.8 13M10 8v2.4c0 1.4-.9 2.6-2.2 2.6" />
              </svg>
            </button>
            <button
              type="button"
              className="comment-tool-btn comment-tool-icon"
              onClick={() => insertSnippet("| Колонка 1 | Колонка 2 |\n| --- | --- |\n| Значение | Значение |\n", true)}
              aria-label="Таблица"
              title="Таблица"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                <path d="M1.5 6.5h13M1.5 10h13M6 2.5v11M10 2.5v11" />
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
        </div>
        {error && <p className="text-error">{error}</p>}
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
