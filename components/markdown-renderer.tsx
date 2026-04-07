"use client";

import { Children, isValidElement, type ReactElement, type ReactNode, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { applyColorTokens } from "@/lib/markdown";

type MarkdownRendererProps = {
  markdown: string;
  className?: string;
};

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "span", "svg", "path", "title"],
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
    title: [...(defaultSchema.attributes?.title ?? [])]
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
    return flattenText(node.props.children);
  }
  return "";
};

const detectCallout = (children: ReactNode) => {
  const items = Children.toArray(children);
  const first = items[0];
  if (!isValidElement<{ children?: ReactNode }>(first) || first.type !== "p") {
    return null;
  }
  const text = flattenText(first.props.children).trim();
  const match = text.match(/^\[!(INFO|WARN|DANGER|CALLOUT)\]\s*(.*)$/i);
  if (!match) {
    return null;
  }

  const type = match[1].toLowerCase();
  const firstContent = match[2].trim();
  const body: ReactNode[] = [];

  if (firstContent.length > 0) {
    body.push(<p key="first">{firstContent}</p>);
  }
  body.push(...items.slice(1));

  return {
    type,
    title:
      type === "info"
        ? "Info"
        : type === "warn"
          ? "Warning"
          : type === "danger"
            ? "Danger"
            : "Callout",
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

export default function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {
  const normalized = markdown
    .replace(/```c#/gi, "```csharp")
    .replace(/```js\b/gi, "```javascript")
    .replace(/```ts\b/gi, "```typescript");
  const transformed = applyColorTokens(normalized);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeHighlight]}
        components={{
          pre: ({ children }) => <EnhancedPre>{children}</EnhancedPre>,
          blockquote: ({ children }) => {
            const callout = detectCallout(children);
            if (!callout) {
              return <blockquote className="md-quote">{children}</blockquote>;
            }
            return (
              <aside className={`md-callout md-callout-${callout.type}`}>
                <strong>{callout.title}</strong>
                <div>{callout.body}</div>
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
