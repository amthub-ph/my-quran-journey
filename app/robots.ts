import type { MetadataRoute } from "next";
import { publicIndexing, siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
 return { rules: { userAgent: "*", ...(publicIndexing ? { allow: "/", disallow: ["/api/"] } : { disallow: "/" }) }, sitemap: siteUrl + "/sitemap.xml" };
}
