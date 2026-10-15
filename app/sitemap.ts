import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
// Only publicly accessible canonical pages belong in the sitemap.
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: siteUrl + "/" }]; }
