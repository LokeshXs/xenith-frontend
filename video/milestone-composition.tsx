import type { CSSProperties } from "react"
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion"
import type { MilestoneCompositionProps } from "./composition-config"
import { Confetti } from "./confetti"
import { milestoneFontFamily } from "./fonts"
import { MilestoneBackdrop } from "./milestone-backdrop"
import { MilestoneCard } from "./milestone-card"
import { getNumberSettleFrame, RollingNumber } from "./rolling-number"

const HANDLE_START = 8
const NUMBER_START = 30
// The supporting lines (FOLLOWERS + footer) come in together, while the number is
// still rolling — not sequentially after it settles.
const SUPPORT_START = 44
const RISE_EASING = Easing.out(Easing.cubic)

// Confetti launches from just below the bottom-center edge (a fountain rising up).
const CONFETTI_ORIGIN = {
  portrait: { x: 0.5, y: 1.02 },
  landscape: { x: 0.5, y: 1.02 },
} as const

export function MilestoneComposition({ handle, followerCount, orientation }: MilestoneCompositionProps) {
  const confettiStart = getNumberSettleFrame(followerCount, NUMBER_START)
  const origin = CONFETTI_ORIGIN[orientation]

  return (
    <AbsoluteFill style={{ fontFamily: milestoneFontFamily, color: "#0c0c0e" }}>
      <MilestoneBackdrop />
      {orientation === "landscape" ? (
        <LandscapeLayout handle={handle} followerCount={followerCount} />
      ) : (
        <PortraitLayout handle={handle} followerCount={followerCount} />
      )}
      <Confetti startFrame={confettiStart} originXRatio={origin.x} originYRatio={origin.y} />
    </AbsoluteFill>
  )
}

type LayoutProps = { handle: string; followerCount: number }

function PortraitLayout({ handle, followerCount }: LayoutProps) {
  return (
    <MilestoneCard style={{ top: 250, bottom: 250, left: 90, right: 90 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "0 70px",
          textAlign: "center",
        }}
      >
        <Handle handle={handle} fontSize={54} startFrame={HANDLE_START} />
        <div style={{ marginTop: 34 }}>
          <RollingNumber value={followerCount} fontSize={240} startFrame={NUMBER_START} />
        </div>
        <FollowersLabel fontSize={34} letterSpacing={14} startFrame={SUPPORT_START} style={{ marginTop: 26 }} />
      </div>
    </MilestoneCard>
  )
}

function LandscapeLayout({ handle, followerCount }: LayoutProps) {
  return (
    <MilestoneCard style={{ top: 60, bottom: 60, left: 60, right: 60 }}>
      <div style={{ display: "flex", flexDirection: "row", height: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            width: "44%",
            padding: "96px 0 96px 110px",
          }}
        >
          <Handle handle={handle} fontSize={58} startFrame={HANDLE_START} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingRight: 90 }}>
          <RollingNumber value={followerCount} fontSize={270} startFrame={NUMBER_START} />
          <FollowersLabel fontSize={32} letterSpacing={13} startFrame={SUPPORT_START} style={{ marginTop: 24 }} />
        </div>
      </div>
    </MilestoneCard>
  )
}

function Handle({ handle, fontSize, startFrame, style }: { handle: string; fontSize: number; startFrame: number; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const cells = [{ char: "@", accent: true }, ...handle.split("").map((char) => ({ char, accent: false }))]

  return (
    <div style={{ display: "flex", fontSize, fontWeight: 700, ...style }}>
      {cells.map((cell, index) => {
        const cellStart = startFrame + index * 2.5
        const progress = interpolate(frame, [cellStart, cellStart + 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: RISE_EASING,
        })
        return (
          <span
            key={index}
            style={{
              display: "inline-block",
              color: cell.accent ? "#5b4ef8" : "#0c0c0e",
              opacity: progress,
              transform: `translateY(${(1 - progress) * 14}px)`,
            }}
          >
            {cell.char}
          </span>
        )
      })}
    </div>
  )
}

function FollowersLabel({ fontSize, letterSpacing, startFrame, style }: { fontSize: number; letterSpacing: number; startFrame: number; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: RISE_EASING,
  })

  return (
    <div
      style={{
        fontSize,
        fontWeight: 500,
        letterSpacing,
        textTransform: "uppercase",
        color: "#6c6c70",
        opacity: progress,
        transform: `translateY(${(1 - progress) * 10}px)`,
        ...style,
      }}
    >
      Followers
    </div>
  )
}
