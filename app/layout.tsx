import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Pwa } from "@/components/pwa";
import { getI18n } from "@/lib/i18n/server";
import { LanguageProvider, LanguageSwitcher } from "@/components/language-provider";
import type { Viewport } from "next";
export const viewport: Viewport = { themeColor: "#315C4B" };

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  display: "swap",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "My Qur’an Journey",
    template: "%s | My Qur’an Journey",
  },
  description:
    "A personal Qur’an reading companion for progress tracking, bookmarks, goals, reminders, and daily reading.",
  applicationName: "My Qur’an Journey",
  appleWebApp: { capable: true, title: "Qur’an Journey", statusBarStyle: "default" },
  icons: { apple: "/icons/icon-192.png" },
  other: { google: "notranslate" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language } = await getI18n();
  return (
    <html lang={language} dir={language === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={`${inter.variable} ${notoNaskhArabic.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider initialLanguage={language}>
            <LanguageSwitcher />
            {children}
            <Pwa />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
