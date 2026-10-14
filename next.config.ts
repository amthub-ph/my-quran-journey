import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  outputFileTracingIncludes: { "/quran/*": ["./data/quran-uthmani.txt"], "/api/quran/*": ["./data/quran-uthmani.txt"] },
  async headers() { return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] }]; },
};

export default nextConfig;
