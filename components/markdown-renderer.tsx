"use client";

import { Children, createElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode, useEffect, useMemo, useState } from "react";
import ReactMarkdown, { type Options as ReactMarkdownOptions } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { applyColorTokens } from "@/lib/markdown";
import { buildHeadingId } from "@/lib/markdown-headings";

type MarkdownRendererProps = {
  markdown: string;
  className?: string;
  allowRawHtml?: boolean;
};

const normalizeLinkHref = (value: string): string => {
  const href = value.trim();
  if (href.length === 0) {
    return href;
  }
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) {
    return href;
  }
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(href)) {
    return `https://${href}`;
  }
  return href;
};

const normalizeImageSrc = (value: string): string => {
  const src = value.trim();
  if (src.length === 0) {
    return src;
  }
  if (/^(https?:|data:image\/|\/)/i.test(src)) {
    return src;
  }
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(src)) {
    return `https://${src}`;
  }
  return src;
};

const normalizeImageSize = (value: string): string | null => {
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  const number = Number.parseInt(raw, 10);
  if (!Number.isFinite(number)) {
    return null;
  }
  const clamped = Math.min(2400, Math.max(24, number));
  return `${clamped}px`;
};

type ParsedImageMeta = {
  alt: string;
  title?: string;
  width?: string;
};

const parseImageMeta = (rawAlt: string, rawTitle?: string): ParsedImageMeta => {
  const title = rawTitle?.trim() || undefined;
  const trimmedAlt = rawAlt.trim();
  const match = trimmedAlt.match(/^(.*)\|\s*(\d{1,4})\s*$/);
  if (!match) {
    return {
      alt: trimmedAlt || "image",
      title
    };
  }

  const width = normalizeImageSize(match[2] ?? "");
  if (!width) {
    return {
      alt: trimmedAlt || "image",
      title
    };
  }

  return {
    alt: (match[1] ?? "").trim() || "image",
    title,
    width
  };
};

const normalizeInlineImageShortcut = (value: string): string => {
  return value.replace(/(^|[\s>])(!?)\[([^\]\n|][^\]\n]*?)\|(\d{1,4})\]\(([^)\s]+)\)/gm, (full, prefix: string, bang: string, alt: string, size: string, href: string) => {
    if (bang === "!") {
      return full;
    }
    return `${prefix}![${alt.trim()}|${size}](${href})`;
  });
};

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "span", "svg", "path", "title", "u", "img", "circle", "rect", "ellipse", "polygon", "polyline", "line", "g"],
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), ["className", /^md-color-(blue|green|orange|red|purple)$/]],
    svg: [
      ...(defaultSchema.attributes?.svg ?? []),
      ["className", "md-inline-icon"],
      ["className", /^md-icon-color-(blue|green|orange|red|purple)$/],
      "viewBox",
      "role",
      "aria-hidden",
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin"
    ],
    path: [...(defaultSchema.attributes?.path ?? []), "d"],
    title: [...(defaultSchema.attributes?.title ?? [])],
    g: [...(defaultSchema.attributes?.g ?? []), "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
    circle: [...(defaultSchema.attributes?.circle ?? []), "cx", "cy", "r", "fill", "stroke", "stroke-width"],
    rect: [...(defaultSchema.attributes?.rect ?? []), "x", "y", "width", "height", "rx", "ry", "fill", "stroke", "stroke-width"],
    ellipse: [...(defaultSchema.attributes?.ellipse ?? []), "cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width"],
    polygon: [...(defaultSchema.attributes?.polygon ?? []), "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
    polyline: [...(defaultSchema.attributes?.polyline ?? []), "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
    line: [...(defaultSchema.attributes?.line ?? []), "x1", "y1", "x2", "y2", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
    img: [...(defaultSchema.attributes?.img ?? []), "src", "alt", "title", "width", "height", "loading", "decoding"]
  }
};

const flattenText = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(flattenText).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (typeof node.type === "string" && (node.type === "svg" || node.type === "path" || node.type === "title")) {
      return "";
    }
    return flattenText(node.props.children);
  }
  return "";
};

const detectCallout = (children: ReactNode) => {
  const items = Children.toArray(children).filter(
    (item) => !(typeof item === "string" && item.trim().length === 0)
  );
  const first = items[0];
  if (!isValidElement<{ children?: ReactNode }>(first) || first.type !== "p") {
    return null;
  }
  const text = flattenText(first.props.children).trim();
  const match = text.match(/^\s*\[!([A-Z]+)\]\s*([\s\S]*)$/i);
  if (!match) {
    return null;
  }

  const rawType = match[1].toUpperCase();
  const type =
    rawType === "INFO" || rawType === "NOTE" || rawType === "TIP"
      ? "info"
      : rawType === "WARN" || rawType === "WARNING" || rawType === "CAUTION"
        ? "warn"
        : rawType === "DANGER" || rawType === "ERROR"
          ? "danger"
          : rawType === "CALLOUT"
            ? "callout"
            : null;
  if (!type) {
    return null;
  }
  const rawInline = match[2].replace(/\r/g, "");
  const inlineLines = rawInline.split("\n");
  const inlineTitle = (inlineLines.shift() ?? "").trim();
  const inlineBodyText = inlineLines.join("\n").trim();
  const body: ReactNode[] = inlineBodyText.length > 0 ? [createElement("p", { key: "callout-inline-body" }, inlineBodyText)] : [];
  body.push(...items.slice(1));

  return {
    type,
    badge:
      type === "info"
        ? "Info"
        : type === "warn"
          ? "Warning"
          : type === "danger"
            ? "Danger"
            : "Callout",
    title: inlineTitle.length > 0 ? inlineTitle : null,
    body
  };
};

function EnhancedPre({ children }: { children?: ReactNode }) {
  const codeNode = useMemo(() => {
    const items = Children.toArray(children);
    return items.find((item) => isValidElement<{ className?: string; children?: ReactNode }>(item)) as
      | ReactElement<{ className?: string; children?: ReactNode }>
      | undefined;
  }, [children]);

  const className = codeNode?.props.className ?? "";
  const languageMatch = className.match(/language-([\w-]+)/);
  const language = languageMatch ? languageMatch[1] : "code";
  const plain = flattenText(codeNode?.props.children ?? children).replace(/\n$/, "");
  const lines = plain.split("\n");
  const collapsible = lines.length > 12;
  const [collapsed, setCollapsed] = useState(collapsible);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCollapsed(collapsible);
  }, [plain, collapsible]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="md-code-block">
      <div className="md-code-toolbar">
        <span>{language}</span>
        <div className="md-code-actions">
          {collapsible && (
            <button type="button" onClick={() => setCollapsed((value) => !value)}>
              <span aria-hidden>{collapsed ? "▾" : "▴"}</span>
              <span>{collapsed ? "Развернуть" : "Свернуть"}</span>
            </button>
          )}
          <button type="button" onClick={onCopy}>
            <span aria-hidden>⧉</span>
            <span>{copied ? "Скопировано" : "Копировать"}</span>
          </button>
        </div>
      </div>
      <pre className={collapsed ? "is-collapsed" : ""}>{children}</pre>
      {collapsed && collapsible && <div className="md-code-more">...</div>}
    </div>
  );
}

export default function MarkdownRenderer({ markdown, className, allowRawHtml = true }: MarkdownRendererProps) {
  const normalized = normalizeInlineImageShortcut(markdown)
    .replace(/```c#/gi, "```csharp")
    .replace(/```js\b/gi, "```javascript")
    .replace(/```ts\b/gi, "```typescript");
  const escapedForSafeMode = allowRawHtml
    ? normalized
    : normalized.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const transformed = applyColorTokens(escapedForSafeMode);
  const needsRawPlugin = allowRawHtml || transformed !== escapedForSafeMode;
  const rehypePlugins = (needsRawPlugin
    ? [rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeHighlight]
    : [[rehypeSanitize, sanitizeSchema], rehypeHighlight]) as NonNullable<ReactMarkdownOptions["rehypePlugins"]>;
  const createHeading = (tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => {
    return ({ children, node }: { children?: ReactNode; node?: { position?: { start?: { line?: number } } } }) => {
      const plainText = flattenText(children).replace(/\s+/g, " ").trim();
      const text = plainText.length > 0 ? plainText : "section";
      const id = buildHeadingId(text, node?.position?.start?.line);
      return createElement(tag, { id }, children);
    };
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={{
          a: ({ href, children }) => {
            const rawHref = typeof href === "string" ? href : "";
            const normalizedHref = normalizeLinkHref(rawHref);

            return (
              <a href={normalizedHref}>
                {children}
              </a>
            );
          },
          img: ({ src, alt, title }) => {
            const rawSrc = typeof src === "string" ? src : "";
            const normalizedSrc = normalizeImageSrc(rawSrc);
            if (!normalizedSrc) {
              return null;
            }
            const parsed = parseImageMeta(typeof alt === "string" ? alt : "", typeof title === "string" ? title : undefined);
            const style: CSSProperties | undefined = parsed.width
              ? {
                  width: parsed.width,
                  height: "auto",
                  maxWidth: "100%"
                }
              : undefined;

            return (
              <img
                src={normalizedSrc}
                alt={parsed.alt}
                title={parsed.title}
                loading="lazy"
                decoding="async"
                style={style}
              />
            );
          },
          h1: createHeading("h1"),
          h2: createHeading("h2"),
          h3: createHeading("h3"),
          h4: createHeading("h4"),
          h5: createHeading("h5"),
          h6: createHeading("h6"),
          pre: ({ children }) => <EnhancedPre>{children}</EnhancedPre>,
          blockquote: ({ children }) => {
            const callout = detectCallout(children);
            if (!callout) {
              return <blockquote className="md-quote">{children}</blockquote>;
            }
            return (
              <aside className={`md-callout md-callout-${callout.type}`}>
                <strong className="md-callout-head">
                  <span className="md-callout-badge">{callout.badge}</span>
                  {callout.title ? <span className="md-callout-title">{callout.title}</span> : null}
                </strong>
                {callout.body.length > 0 ? <div className="md-callout-body">{callout.body}</div> : null}
              </aside>
            );
          }
        }}
      >
        {transformed}
      </ReactMarkdown>
    </div>
  );
}
