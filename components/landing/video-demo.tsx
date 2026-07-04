"use client"

import { useRef, useState } from "react"
import { IconPlayerPlayFilled } from "@tabler/icons-react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react"

const DEMO_YOUTUBE_URL = "https://www.youtube.com/watch?v=Aynww6Dhy_w"
const DEMO_VIDEO_TITLE = "Xenith product demo video"

function getYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1) || null
    }

    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "m.youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v")
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null
      }
    }
  } catch {
    return null
  }

  return null
}

export function VideoDemo() {
  const sectionRef = useRef<HTMLElement>(null)
  const [playing, setPlaying] = useState(false)
  const reduceMotion = useReducedMotion()
  const [thumbnailUrl, setThumbnailUrl] = useState(() => {
    const videoId = getYouTubeVideoId(DEMO_YOUTUBE_URL)
    return videoId
      ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
      : "/demo.png"
  })

  const videoId = getYouTubeVideoId(DEMO_YOUTUBE_URL)
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : null

  // 0 → section top hits viewport bottom; 1 → section center hits viewport center,
  // so the frame settles flat before the user scrolls past it.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  })

  // Spring-smoothed so the tilt doesn't jitter 1:1 with the scrollbar.
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  const rotateX = useTransform(smooth, [0, 1], [20, 0])
  const scale = useTransform(smooth, [0, 1], [0.92, 1])
  // Opacity rides the raw progress for a crisp fade-in.
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1])

  function handlePlay() {
    if (!embedUrl) return
    setPlaying(true)
  }

  return (
    <section
      id="demo"
      ref={sectionRef}
      className="container relative mx-auto scroll-mt-24 px-4 py-14 sm:px-12 sm:py-28"
    >
      {/* Perspective lives on the parent of the rotated node, or the 3D collapses. */}
      <div className="mx-auto max-w-6xl" style={{ perspective: "1200px" }}>
        <motion.div
          style={
            reduceMotion
              ? { opacity }
              : {
                  rotateX,
                  scale,
                  opacity,
                  transformStyle: "preserve-3d",
                  transformOrigin: "center top",
                  willChange: "transform",
                }
          }
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2 sm:py-3">
            <div className="flex gap-1.5" aria-hidden>
              <span className="size-2 sm:size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-2 sm:size-3 rounded-full bg-[#febc2e]" />
              <span className="size-2 sm:size-3 rounded-full bg-[#28c840]" />
            </div>
            <p className="ml-2 sm:ml-3 text-xs text-muted-foreground">
              xenith.app
            </p>
          </div>

          {/* Video — aspect-video reserves height so there's no layout shift. */}
          <div className="relative aspect-video w-full bg-card">
            {playing && embedUrl && (
              <iframe
                src={embedUrl}
                title={DEMO_VIDEO_TITLE}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="size-full"
              />
            )}

            {!playing && (
              <button
                type="button"
                onClick={handlePlay}
                aria-label="Play demo video"
                className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnails should not require Next image remote config. */}
                <img
                  src={thumbnailUrl}
                  alt="Preview of the Xenith app"
                  className="absolute inset-0 size-full object-cover"
                  onError={() => setThumbnailUrl("/demo.png")}
                />
                {/* Scrim so the play button reads over any poster content. */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30"
                />
                <span className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
                  <IconPlayerPlayFilled className="size-7" aria-hidden />
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
