/**
 * Pings the backend's public health endpoint (`GET /api/v1/health`, no auth).
 *
 * Uses native `fetch` so it works in both RSC and client contexts.
 * Returns `true` only on a 200 response; any error, non-200, or timeout
 * resolves to `false`.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/health`,
      { signal: AbortSignal.timeout(5000) }
    )
    return res.ok
  } catch {
    return false
  }
}
