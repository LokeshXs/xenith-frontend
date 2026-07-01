import { ImageResponse } from "next/og"

import { siteConfig } from "@/lib/seo/config"

// Branded social-share card, generated at build/request time so it always
// resolves to an absolute URL (via metadataBase) without needing a static asset.
export const alt = siteConfig.title
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

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
          background:
            "linear-gradient(135deg, #5b4ef8 0%, #3d33c4 100%)",
          color: "#ffffff",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {siteConfig.name}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            {siteConfig.tagline}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: "rgba(255,255,255,0.82)",
              maxWidth: "880px",
            }}
          >
            Your X growth engine — posts and replies in your real voice.
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
