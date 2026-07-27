import type { CSSProperties } from "react"
import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame } from "remotion"
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
  square: { x: 0.5, y: 1.02 },
  landscape: { x: 0.5, y: 1.02 },
} as const

export function MilestoneComposition({
  handle,
  followerCount,
  orientation,
  numberFormat,
  profileImageDataUrl,
  imageTreatment,
}: MilestoneCompositionProps) {
  const confettiStart = getNumberSettleFrame(followerCount, NUMBER_START, numberFormat)
  const origin = CONFETTI_ORIGIN[orientation]
  const layoutProps: LayoutProps = {
    handle,
    followerCount,
    numberFormat,
    profileImageDataUrl,
    imageTreatment,
  }

  return (
    <AbsoluteFill style={{ fontFamily: milestoneFontFamily, color: "#0c0c0e" }}>
      <MilestoneBackdrop />
      {orientation === "landscape" ? (
        <LandscapeLayout {...layoutProps} />
      ) : orientation === "square" ? (
        <SquareLayout {...layoutProps} />
      ) : (
        <PortraitLayout {...layoutProps} />
      )}
      <Confetti startFrame={confettiStart} originXRatio={origin.x} originYRatio={origin.y} />
    </AbsoluteFill>
  )
}

type LayoutProps = Pick<
  MilestoneCompositionProps,
  "handle" | "followerCount" | "numberFormat" | "profileImageDataUrl" | "imageTreatment"
>

function PortraitLayout({
  handle,
  followerCount,
  numberFormat,
  profileImageDataUrl,
  imageTreatment,
}: LayoutProps) {
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
        {profileImageDataUrl && (
          <IdentityImage src={profileImageDataUrl} treatment={imageTreatment} size={144} style={{ marginBottom: 34 }} />
        )}
        <Handle handle={handle} fontSize={54} startFrame={HANDLE_START} />
        <div style={{ marginTop: 34 }}>
          <RollingNumber value={followerCount} fontSize={240} startFrame={NUMBER_START} numberFormat={numberFormat} />
        </div>
        <FollowersLabel fontSize={34} letterSpacing={14} startFrame={SUPPORT_START} style={{ marginTop: 26 }} />
      </div>
    </MilestoneCard>
  )
}

function SquareLayout({
  handle,
  followerCount,
  numberFormat,
  profileImageDataUrl,
  imageTreatment,
}: LayoutProps) {
  return (
    <MilestoneCard style={{ top: 64, bottom: 64, left: 64, right: 64 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        {profileImageDataUrl && (
          <IdentityImage src={profileImageDataUrl} treatment={imageTreatment} size={128} style={{ marginBottom: 28 }} />
        )}
        <Handle handle={handle} fontSize={44} startFrame={HANDLE_START} />
        <div style={{ marginTop: 24 }}>
          <RollingNumber value={followerCount} fontSize={190} startFrame={NUMBER_START} numberFormat={numberFormat} />
        </div>
        <FollowersLabel fontSize={28} letterSpacing={11} startFrame={SUPPORT_START} style={{ marginTop: 20 }} />
      </div>
    </MilestoneCard>
  )
}

function LandscapeLayout({
  handle,
  followerCount,
  numberFormat,
  profileImageDataUrl,
  imageTreatment,
}: LayoutProps) {
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
          {profileImageDataUrl && (
            <IdentityImage src={profileImageDataUrl} treatment={imageTreatment} size={150} style={{ marginBottom: 34 }} />
          )}
          <Handle handle={handle} fontSize={58} startFrame={HANDLE_START} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingRight: 90 }}>
          <RollingNumber value={followerCount} fontSize={270} startFrame={NUMBER_START} numberFormat={numberFormat} />
          <FollowersLabel fontSize={32} letterSpacing={13} startFrame={SUPPORT_START} style={{ marginTop: 24 }} />
        </div>
      </div>
    </MilestoneCard>
  )
}

function IdentityImage({
  src,
  treatment,
  size,
  style,
}: {
  src: string
  treatment: MilestoneCompositionProps["imageTreatment"]
  size: number
  style?: CSSProperties
}) {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [4, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: RISE_EASING,
  })
  const logo = treatment === "logo"

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: logo ? Math.round(size * 0.12) : 0,
        borderRadius: logo ? Math.round(size * 0.22) : 999,
        background: logo ? "rgba(255, 255, 255, 0.72)" : "transparent",
        border: logo ? "1px solid rgba(91, 78, 248, 0.12)" : `${Math.max(3, Math.round(size * 0.035))}px solid rgba(255, 255, 255, 0.9)`,
        boxShadow: "0 18px 45px rgba(54, 45, 160, 0.14)",
        boxSizing: "border-box",
        opacity: progress,
        transform: `scale(${0.9 + progress * 0.1})`,
        ...style,
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: logo ? "contain" : "cover",
          borderRadius: logo ? Math.round(size * 0.12) : 999,
        }}
      />
    </div>
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
