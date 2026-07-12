import { continueRender, delayRender } from "remotion"

// Reuse the app's existing self-hosted sans (Outfit), exposed on <html> as --font-sans
// by the root layout. The web-renderer draws inside that same document, so the var cascades.
export const milestoneFontFamily = "var(--font-sans), sans-serif"

// Gate capture until webfonts are ready so exported frames aren't rendered with a fallback.
const handle = delayRender("Waiting for fonts")
if (typeof document !== "undefined" && document.fonts?.ready) {
  document.fonts.ready.then(() => continueRender(handle)).catch(() => continueRender(handle))
} else {
  continueRender(handle)
}
