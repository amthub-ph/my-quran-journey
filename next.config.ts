import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  outputFileTracingIncludes: { "/quran/*": ["./data/quran-uthmani.txt"], "/api/quran/*": ["./data/quran-uthmani.txt"] },
  async headers() { return [...["/auth/:path*", "/protected/:path*", "/progress/:path*", "/reflections/:path*", "/reminders/:path*", "/bookmarks/:path*", "/quran/:path*", "/onboarding/:path*", "/api/:path*", "/offline.html"].map(source => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] })), { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] }]; },
};

export default nextConfig;
