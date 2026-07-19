import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // `relaxed` applies only to the public /milestone tool, which renders video
    // in the browser via @remotion/web-renderer (needs blob-URL workers + WASM).
    // Every other route keeps the strict policy unchanged.
    const buildHeaders = (relaxed: boolean) => {
      const connectSources = [
        "'self'",
        "https://cloud.umami.is",
        "https://www.google-analytics.com",
        "https://vitals.vercel-insights.com",
        "https://*.supabase.co",
        "https://growwithxenith.com",
        "https://api.growwithxenith.com",
        // Local API origin for development only — never ship it to the
        // production CSP. In dev, set NEXT_PUBLIC_API_URL=http://localhost:3001.
        ...(!isProduction ? ["http://localhost:3001"] : []),
        ...(apiUrl ? [apiUrl] : []),
        ...(relaxed ? ["https://www.remotion.pro"] : []),
      ];
      const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "form-action 'self'",
        "img-src 'self' data: blob: https://pbs.twimg.com https://i.ytimg.com",
        "font-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}${relaxed ? " 'wasm-unsafe-eval'" : ""} https://cloud.umami.is https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com`,
        `connect-src ${connectSources.join(" ")}`,
        "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
        ...(relaxed ? ["media-src 'self' blob:"] : []),
        ...(relaxed ? ["worker-src 'self' blob:"] : []),
        ...(isProduction ? ["upgrade-insecure-requests"] : []),
      ].join("; ");

      const headers = [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=()",
        },
      ];
      if (isProduction) {
        headers.push({
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        });
      }
      return headers;
    };

    return [
      // Strict policy for every route except the milestone tool.
      { source: "/:path((?!milestone).*)", headers: buildHeaders(false) },
      // Relaxed policy for the milestone tool (browser video rendering).
      { source: "/milestone", headers: buildHeaders(true) },
      { source: "/milestone/:path*", headers: buildHeaders(true) },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        pathname: "/profile_images/**",
      },
    ],
  },
};

export default nextConfig;
