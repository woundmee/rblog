import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

type TwitterImageProps = {
  params: Promise<{ slug: string }>;
};

const shorten = (value: string, maxLength: number): string => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
};

export default async function PostTwitterImage({ params }: TwitterImageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = shorten(post?.title || "rblog", 120);
  const subtitle = shorten(post?.excerpt || "Минималистичный IT-блог о разработке.", 170);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background: "#0b0c10",
          color: "#f4f5f7",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "32px", fontWeight: 700 }}>
          <span
            style={{
              display: "flex",
              border: "1px solid #2d3139",
              borderRadius: "999px",
              padding: "6px 12px",
              background: "#12141a"
            }}
          >
            &lt;/&gt;
          </span>
          rblog
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "56px", lineHeight: 1.07, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: "24px", color: "#aeb5c2", lineHeight: 1.3 }}>{subtitle}</div>
        </div>

        <div style={{ fontSize: "22px", color: "#838b99" }}>rblog.tech</div>
      </div>
    ),
    size
  );
}
