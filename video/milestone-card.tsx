import type { CSSProperties, ReactNode } from "react"

// Transparent positioned frame: it lays out the content inset from the edges
// while the gradient backdrop shows through continuously (no white card fill).
export function MilestoneCard({ style, children }: { style?: CSSProperties; children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
