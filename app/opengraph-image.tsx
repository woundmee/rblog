import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "rblog";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
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
              display: "inline-flex",
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

        <div style={{ display: "grid", gap: "10px" }}>
          <div style={{ fontSize: "64px", lineHeight: 1.05, fontWeight: 700 }}>IT-блог о разработке</div>
          <div style={{ fontSize: "27px", color: "#aeb5c2" }}>
            Статьи, ресурсы и практические заметки про инженерные решения.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", color: "#838b99", fontSize: "24px" }}>
          <span>rblog.tech</span>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
