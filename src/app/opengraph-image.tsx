import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Mahalli";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand OG card. Latin-only text so next/og's built-in font covers every glyph
// (no font fetching at build/request time).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(150deg, #1c5e3a 0%, #2f9e5e 58%, #5fd592 130%)",
          color: "#fff",
          fontWeight: 800,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2f9e5e",
              fontSize: 56,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 96, letterSpacing: -3 }}>Mahalli</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 34, fontWeight: 600, color: "rgba(255,255,255,.88)" }}>
          Run your shop from your phone
        </div>
        <div style={{ marginTop: 56, fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,.7)" }}>
          mahalli.app
        </div>
      </div>
    ),
    size,
  );
}
