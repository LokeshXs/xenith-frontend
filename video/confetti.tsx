import { interpolate, useCurrentFrame, useVideoConfig } from "remotion"

const PIECE_COUNT = 84
const LIFETIME = 68
const COLORS = ["#5b4ef8", "#8b82ff", "#b6b1ff", "#f5a623", "#ff5c8a", "#22c9a8"]

// Deterministic pseudo-random in [0, 1) from an index + seed (no Math.random, so
// every render is identical — required for stable video output).
function rand(index: number, seed: number): number {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453
  return value - Math.floor(value)
}

type Piece = {
  color: string
  angle: number
  speed: number
  gravity: number
  size: number
  ratio: number
  spin: number
  delay: number
  drift: number
}

const PIECES: Piece[] = Array.from({ length: PIECE_COUNT }, (_, i) => ({
  color: COLORS[Math.floor(rand(i, 1) * COLORS.length)],
  // Fountain: aim upward with a moderate horizontal fan (≈ ±63° around straight up).
  angle: -Math.PI / 2 + (rand(i, 2) - 0.5) * Math.PI * 0.7,
  // High initial speed so pieces rise well up into the frame from the bottom edge.
  speed: 26 + rand(i, 3) * 30,
  gravity: 0.55 + rand(i, 4) * 0.4,
  size: 12 + rand(i, 5) * 16,
  ratio: 0.4 + rand(i, 6) * 0.6,
  spin: (rand(i, 7) - 0.5) * 26,
  delay: rand(i, 8) * 6,
  drift: (rand(i, 9) - 0.5) * 6,
}))

export function Confetti({ startFrame, originXRatio, originYRatio }: { startFrame: number; originXRatio: number; originYRatio: number }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const originX = width * originXRatio
  const originY = height * originYRatio
  const scale = width / 1080

  if (frame < startFrame) return null

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {PIECES.map((piece, index) => {
        const t = frame - startFrame - piece.delay
        if (t < 0 || t > LIFETIME) return null

        const speed = piece.speed * scale
        const x = originX + Math.cos(piece.angle) * speed * t + piece.drift * scale * t
        const y = originY + Math.sin(piece.angle) * speed * t + 0.5 * piece.gravity * scale * t * t
        const rotation = piece.spin * t
        const opacity = interpolate(t, [0, 4, LIFETIME - 18, LIFETIME], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
        const w = piece.size * scale
        const h = piece.size * piece.ratio * scale

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: h,
              backgroundColor: piece.color,
              borderRadius: 2 * scale,
              opacity,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            }}
          />
        )
      })}
    </div>
  )
}
