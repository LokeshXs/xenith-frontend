import type { CSSProperties } from "react"
import { Easing, interpolate, useCurrentFrame } from "remotion"
import { formatFullFollowerCount } from "../lib/milestone/formatters"

// The design is tuned so a 6-character number (e.g. "10,000") fills the space.
// Longer numbers scale down so they never overflow their container.
const REFERENCE_LENGTH = 6
// Per-digit roll timing (frames). Each column spins one full 0-9 cycle before landing.
const ROLL_DURATION = 48
const COLUMN_STAGGER = 7
const SPIN_ROWS = 10

const ROLL_EASING = Easing.bezier(0.16, 1, 0.3, 1)

// The frame at which the last digit column has finished rolling (its settle point).
// Shared with the composition so the confetti burst is timed to the number landing.
export function getNumberSettleFrame(value: number, startFrame: number): number {
  const digitCount = formatFullFollowerCount(value).replace(/\D/g, "").length
  return startFrame + Math.max(0, digitCount - 1) * COLUMN_STAGGER + ROLL_DURATION
}

type CharCell = { type: "digit"; value: number; order: number } | { type: "separator"; char: string }

export function RollingNumber({ value, fontSize, startFrame = 0 }: { value: number; fontSize: number; startFrame?: number }) {
  const frame = useCurrentFrame()
  const text = formatFullFollowerCount(value)
  const scaledFontSize = fontSize * Math.min(1, REFERENCE_LENGTH / text.length)
  const digitHeight = scaledFontSize

  const cells: CharCell[] = text.split("").map((char, index) => {
    if (char >= "0" && char <= "9") {
      // A digit's roll order is how many digits precede it (ignoring separators).
      const order = text.slice(0, index).replace(/\D/g, "").length
      return { type: "digit", value: Number(char), order }
    }
    return { type: "separator", char }
  })
  const settleFrame = getNumberSettleFrame(value, startFrame)

  const entrance = interpolate(frame, [startFrame - 6, startFrame + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const pop = interpolate(frame, [settleFrame - 4, settleFrame + 4, settleFrame + 16], [1, 1.05, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const glowOpacity = interpolate(frame, [settleFrame - 10, settleFrame, settleFrame + 30], [0, 0.55, 0.32], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const shimmerActive = frame >= settleFrame - 2 && frame <= settleFrame + 22
  const shimmerX = interpolate(frame, [settleFrame - 2, settleFrame + 22], [-160, 280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  const numberBase: CSSProperties = {
    fontSize: scaledFontSize,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  }
  const gradientText: CSSProperties = {
    color: "#5b4ef8",
    backgroundImage: "linear-gradient(180deg, #5b4ef8 0%, #8b82ff 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: entrance,
        transform: `scale(${(0.92 + entrance * 0.08) * pop})`,
      }}
    >
      {/* Celebratory glow bloom that peaks as the number lands. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: scaledFontSize * 4,
          height: scaledFontSize * 2.4,
          transform: "translate(-50%, -50%)",
          borderRadius: 999,
          background: "radial-gradient(closest-side, rgba(91, 78, 248, 0.28), rgba(91, 78, 248, 0))",
          opacity: glowOpacity,
        }}
      />
      {/* Ghost echo — a larger, barely-visible duplicate that adds depth. */}
      <span
        aria-hidden
        style={{
          ...numberBase,
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -52%) scale(1.12)",
          color: "rgba(91, 78, 248, 0.05)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      {/* The number itself — digit columns roll to their target, separators stay put. */}
      <div style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap", letterSpacing: scaledFontSize * -0.02 }}>
        {cells.map((cell, index) =>
          cell.type === "separator" ? (
            <span
              key={index}
              style={{ ...numberBase, ...gradientText, display: "inline-block", height: digitHeight, lineHeight: `${digitHeight}px`, verticalAlign: "top" }}
            >
              {cell.char}
            </span>
          ) : (
            <DigitColumn
              key={index}
              target={cell.value}
              height={digitHeight}
              numberBase={numberBase}
              gradientText={gradientText}
              frame={frame}
              start={startFrame + cell.order * COLUMN_STAGGER}
            />
          ),
        )}
        {/* Shimmer sweep across the number on landing. */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: shimmerActive ? 1 : 0 }}>
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: 0,
              width: "34%",
              height: "200%",
              background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)",
              transform: `translateX(${shimmerX}%) skewX(-16deg)`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

function DigitColumn({
  target,
  height,
  numberBase,
  gradientText,
  frame,
  start,
}: {
  target: number
  height: number
  numberBase: CSSProperties
  gradientText: CSSProperties
  frame: number
  start: number
}) {
  const progress = interpolate(frame, [start, start + ROLL_DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ROLL_EASING,
  })
  const rows = [...Array(SPIN_ROWS).keys(), ...Array(target + 1).keys()]
  const finalIndex = SPIN_ROWS + target
  const offset = progress * finalIndex * height

  return (
    <span style={{ display: "inline-block", height, overflow: "hidden", verticalAlign: "top" }}>
      <span style={{ display: "block", transform: `translateY(${-offset}px)` }}>
        {rows.map((digit, index) => (
          <span
            key={index}
            style={{ ...numberBase, ...gradientText, display: "block", height, lineHeight: `${height}px`, textAlign: "center" }}
          >
            {digit}
          </span>
        ))}
      </span>
    </span>
  )
}
