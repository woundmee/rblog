import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

type OgImageProps = {
  params: Promise<{ slug: string }>;
};

const shorten = (value: string, maxLength: number): string => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
};

export default async function PostOpenGraphImage({ params }: OgImageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = shorten(post?.title || "rblog", 120);
  const subtitle = shorten(post?.excerpt || "IT-блог о разработке.", 170);

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            fontSize: "28px",
            letterSpacing: "0.02em"
          }}
        >
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
          <span style={{ fontWeight: 700 }}>rblog</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontSize: "62px", lineHeight: 1.06, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: "24px", color: "#aeb5c2", lineHeight: 1.28 }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", gap: "12px", color: "#838b99", fontSize: "22px" }}>
          <span>rblog.tech</span>
        </div>
      </div>
    ),
    size
  );
}
