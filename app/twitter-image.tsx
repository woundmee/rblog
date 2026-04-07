import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "rblog";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "22px",
          padding: "56px",
          background: "#0b0c10",
          color: "#f4f5f7",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", fontSize: "32px", fontWeight: 700 }}>
          <span
            style={{
              display: "inline-flex",
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
        <div style={{ fontSize: "56px", lineHeight: 1.05, fontWeight: 700 }}>Минималистичный IT-блог</div>
        <div style={{ fontSize: "26px", color: "#aeb5c2" }}>Статьи, ресурсы, заметки и разборы</div>
      </div>
    ),
    {
      ...size
    }
  );
}
