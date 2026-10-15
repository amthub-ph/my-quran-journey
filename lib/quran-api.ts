import "server-only";
import { createServerClient } from "@quranjs/api/server";

export const quranClient = createServerClient({
  clientId: process.env.QF_CLIENT_ID!,
  clientSecret: process.env.QF_CLIENT_SECRET!,
  services: {
    gatewayUrl: process.env.QF_ENV === "production" ? "https://apis.quran.foundation" : "https://apis-prelive.quran.foundation",
    oauth2BaseUrl: process.env.QF_ENV === "production" ? "https://oauth2.quran.foundation" : "https://prelive-oauth2.quran.foundation",
  },
});