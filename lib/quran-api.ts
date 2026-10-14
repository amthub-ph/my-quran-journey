import "server-only";
import { createServerClient } from "@quranjs/api/server";

export const quranClient = createServerClient({
  clientId: process.env.QF_CLIENT_ID!,
  clientSecret: process.env.QF_CLIENT_SECRET!,
  services: {
    gatewayUrl: "https://apis-prelive.quran.foundation",
    oauth2BaseUrl: "https://prelive-oauth2.quran.foundation",
  },
});