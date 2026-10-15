import type { Metadata } from "next";
import { siteUrl, siteName, siteDescription, publicIndexing } from "@/lib/seo";
import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getI18n();
  const title = language === "ar" ? "رحلتي مع القرآن | قراءة القرآن والاستماع وتتبع التقدم" : "My Qur’an Journey | Read Quran, Listen & Track Your Progress";
  const description = language === "ar" ? "اقرأ القرآن بالعربية أو ترجمات معانيه بالإنجليزية والتاغالوغية. استمع للتلاوة واحفظ موضعك وتابع تقدمك واضبط تذكيرات القراءة اليومية." : siteDescription;
  return {
    title: { absolute: title }, description,
    alternates: { canonical: siteUrl + "/" },
    robots: { index: publicIndexing, follow: publicIndexing },
    openGraph: { type: "website", url: siteUrl + "/", siteName, title, description, locale: language === "ar" ? "ar_AR" : "en_US" },
    twitter: { card: "summary_large_image", title, description },
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

export default async function Home() {
const { t } = await getI18n();

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: siteUrl + "/", description: siteDescription, inLanguage: ["en", "ar"] }).replace(/</g, "\\u003c") }} />
      {/* HEADER */}
      <header className="border-b border-[var(--border)] bg-white/90">
        <div className="quran-container flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-lg font-semibold text-white">
              ق
            </div>

            <div>
              <p className="text-sm font-semibold leading-tight text-[var(--foreground)]">
                {t("My Qur’an Journey")}{" "}</p>
              <p className="text-xs text-[var(--muted)]">
                {t("Read • Reflect • Continue")}{" "}</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense fallback={<div className="h-10 w-24" />}>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="quran-container py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* LEFT */}
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-medium text-[var(--primary)]">
              {t("Your personal Qur’an reading companion")}{" "}</div>

            <p className="arabic-text mb-3 text-right text-3xl text-[var(--primary)] sm:text-4xl">
              السَّلَامُ عَلَيْكُمْ
            </p>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t("Continue your Qur’an journey,")}{" "}<span className="block text-[var(--primary)]">
                {t("one ayah at a time.")}{" "}</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              {t("Read the Qur’an, save exactly where you stopped, track your progress, set reading goals, keep bookmarks, and continue your journey whenever you return.")}{" "}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/protected"
                className="quran-btn-primary inline-flex items-center justify-center"
              >
                {t("Continue My Journey")}{" "}</Link>

              <Link
                href="/auth/sign-up"
                className="quran-btn-secondary inline-flex items-center justify-center"
              >
                {t("Create Account")}{" "}</Link>
            </div>

            <p className="mt-4 text-sm text-[var(--muted)]">
              {t("Your reading progress belongs to your account and can be resumed when you return.")}{" "}</p>
          </div>

          {/* RIGHT */}
          <div className="quran-card overflow-hidden p-5 sm:p-7">
            <div className="rounded-2xl bg-[var(--primary-soft)] p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--muted)]">
                    {t("Continue Reading")}{" "}</p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {t("Surah Al-Baqarah")}{" "}</h2>

                  <p className="arabic-text mt-1 text-2xl text-[var(--primary)]">
                    سورة البقرة
                  </p>
                </div>

                <div className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[var(--primary)]">
                  15%
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">{t("Reading progress")}</span>
                  <span className="font-medium">{t("42 / 286 Ayat")}</span>
                </div>

                <div className="quran-progress">
                  <span style={{ width: "15%" }} />
                </div>
              </div>

              <button
                type="button"
                className="quran-btn-primary mt-6 w-full"
              >
                {t("Resume from Ayah 42")}{" "}</button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted)]">{t("Today’s Goal")}</p>
                <p className="mt-1 text-xl font-semibold">6 / 10</p>
                <p className="text-xs text-[var(--muted)]">{t("Ayat read")}</p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted)]">{t("Reading Streak")}</p>
                <p className="mt-1 text-xl font-semibold">{t("7 Days")}</p>
                <p className="text-xs text-[var(--muted)]">{t("Keep going")}</p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted)]">
                  {t("Surahs Completed")}{" "}</p>
                <p className="mt-1 text-xl font-semibold">12 / 114</p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] p-4">
                <p className="text-xs text-[var(--muted)]">{t("Juz Completed")}</p>
                <p className="mt-1 text-xl font-semibold">3 / 30</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-[var(--border)] bg-white py-12 sm:py-16">
        <div className="quran-container">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--gold)]">
              {t("Built for consistency")}{" "}</p>

            <h2 className="mt-2 text-3xl font-semibold">
              {t("Everything you need to keep reading.")}{" "}</h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              title={t("Save Your Place")}
              text={t("Pause at any ayah and return to the exact place you stopped.")}
            />

            <FeatureCard
              title={t("Track Progress")}
              text={t("Follow your progress through Surahs, Juz, and the complete Qur’an.")}
            />

            <FeatureCard
              title={t("Bookmarks")}
              text={t("Save meaningful ayat so you can easily return to them later.")}
            />

            <FeatureCard
              title={t("Reading Reminders")}
              text={t("Create a reading routine and schedule reminders to continue.")}
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] py-6">
        <div className="quran-container text-center text-sm text-[var(--muted)]">
          {t("My Qur’an Journey")}{" "}</div>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="quran-card p-5">
      <div className="mb-4 h-10 w-10 rounded-xl bg-[var(--primary-soft)]" />

      <h3 className="font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </div>
  );
}