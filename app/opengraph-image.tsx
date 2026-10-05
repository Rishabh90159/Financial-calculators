import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Statically generated at build time; shared by every page's Open Graph / Twitter card. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f5ef",
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
          color: "#12202f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "#0b5d4b", display: "flex" }} />
          <div style={{ fontSize: 44, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>{siteConfig.tagline}</div>
          <div style={{ fontSize: 30, color: "#4a5868", fontFamily: "sans-serif" }}>
            EMI · SIP · Loan · Home loan calculators with clear formulas
          </div>
        </div>
        <div style={{ display: "flex", height: 10, width: "100%" }}>
          <div style={{ flex: 64, background: "#0b5d4b" }} />
          <div style={{ flex: 36, background: "#a24a06" }} />
        </div>
      </div>
    ),
    size,
  );
}
