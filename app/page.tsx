import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  siteUrl,
  siteName,
  siteDescription,
  publicIndexing,
} from "@/lib/seo";

import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { SavedPosition } from "@/components/saved-position";
import { DailyGoal } from "@/components/daily-goal";
import { SurahProgress } from "@/components/surah-progress";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getI18n();

  const title =
    language === "ar"
      ? "رحلتي مع القرآن | قراءة القرآن والاستماع وتتبع التقدم"
      : "My Qur’an Journey | Read Quran, Listen & Track Your Progress";

  const description =
    language === "ar"
      ? "اقرأ القرآن بالعربية أو ترجمات معانيه بالإنجليزية والتاغالوغية. استمع للتلاوة واحفظ موضعك وتابع تقدمك واضبط تذكيرات القراءة اليومية."
      : siteDescription;

  return {
    title: {
      absolute: title,
    },

    description,

    alternates: {
      canonical: siteUrl + "/",
    },

    robots: {
      index: publicIndexing,
      follow: publicIndexing,
    },

    openGraph: {
      type: "website",
      url: siteUrl + "/",
      siteName,
      title,
      description,
      locale:
        language === "ar"
          ? "ar_AR"
          : "en_US",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },

    verification: process.env
      .GOOGLE_SITE_VERIFICATION
      ? {
          google:
            process.env
              .GOOGLE_SITE_VERIFICATION,
        }
      : undefined,
  };
}

export default async function Home() {
  const {
    t,
    language,
  } = await getI18n();

  const isArabic =
    language === "ar";

  /*
   * Check authentication.
   */
  const db =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await db.auth.getUser();

  /*
   * Signed-in data.
   *
   * Signed-out visitors never receive
   * fake progress numbers.
   */
  let profile:
    | {
        full_name: string | null;
        daily_goal: number | null;
      }
    | null = null;

  let progress:
    | {
        verse_key: string;
        updated_at: string;
      }[]
    | null = null;

  let profileError = false;
  let progressError = false;

  if (user) {
    const [
      profileResult,
      progressResult,
    ] =
      await Promise.all([
        db
          .from("profiles")
          .select(
            "full_name,daily_goal",
          )
          .eq(
            "id",
            user.id,
          )
          .maybeSingle(),

        db
          .from(
            "journey_progress",
          )
          .select(
            "verse_key,updated_at",
          )
          .eq(
            "user_id",
            user.id,
          )
          .order(
            "updated_at",
            {
              ascending:
                false,
            },
          ),
      ]);

    profile =
      profileResult.data;

    progress =
      progressResult.data;

    profileError =
      !!profileResult.error;

    progressError =
      !!progressResult.error;
  }

  const firstName =
    profile?.full_name
      ?.split(" ")[0] ||
    t("Reader");

  const dailyGoal =
    profile?.daily_goal ||
    10;

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context":
              "https://schema.org",
            "@type":
              "WebSite",
            name: siteName,
            url:
              siteUrl +
              "/",
            description:
              siteDescription,
            inLanguage: [
              "en",
              "ar",
            ],
          }).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      {/* HEADER */}
      <header className="border-b border-[var(--border)] bg-white/90">
        <div className="quran-container flex min-h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-lg font-semibold text-white">
              ق
            </div>

            <div>
              <p className="text-sm font-semibold leading-tight text-[var(--foreground)]">
                {t(
                  "My Qur’an Journey",
                )}
              </p>

              <p className="text-xs text-[var(--muted)]">
                {t(
                  "Read • Reflect • Continue",
                )}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense
                fallback={
                  <div className="h-10 w-24" />
                }
              >
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
              {t(
                "Your personal Qur’an reading companion",
              )}
            </div>

            <p className="arabic-text mb-3 text-right text-3xl text-[var(--primary)] sm:text-4xl">
              السَّلَامُ عَلَيْكُمْ
            </p>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {user ? (
                <>
                  {t(
                    "Continue your Qur’an journey,",
                  )}{" "}
                  <span className="block text-[var(--primary)]">
                    {firstName}.
                  </span>
                </>
              ) : (
                <>
                  {t(
                    "Continue your Qur’an journey,",
                  )}{" "}
                  <span className="block text-[var(--primary)]">
                    {t(
                      "one ayah at a time.",
                    )}
                  </span>
                </>
              )}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              {user
                ? t(
                    "Your saved Qur’an journey is ready. Continue reading, track your progress, and keep building your daily habit.",
                  )
                : t(
                    "Read the Qur’an, listen to recitation, save exactly where you stopped, track your progress, set reading goals, keep bookmarks, and continue your journey whenever you return.",
                  )}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={
                  user
                    ? "/protected"
                    : "/start"
                }
                className="quran-btn-primary inline-flex items-center justify-center"
              >
                {user
                  ? t(
                      "Continue My Journey",
                    )
                  : t(
                      "Start My Journey",
                    )}
              </Link>

              {!user && (
                <Link
                  href="/auth/sign-up"
                  className="quran-btn-secondary inline-flex items-center justify-center"
                >
                  {t(
                    "Create Account",
                  )}
                </Link>
              )}

              {user && (
                <Link
                  href="/quran"
                  className="quran-btn-secondary inline-flex items-center justify-center"
                >
                  {t(
                    "Read Qur’an",
                  )}
                </Link>
              )}
            </div>

            <p className="mt-4 text-sm text-[var(--muted)]">
              {user
                ? t(
                    "Your reading progress is connected to your account.",
                  )
                : t(
                    "Continue as a guest or create an account to save your journey permanently.",
                  )}
            </p>
          </div>

          {/* RIGHT */}
          {user ? (
            /*
             * SIGNED-IN USER:
             * REAL DATA
             */
            <div className="space-y-5">
              {/* CONTINUE READING */}
              <div className="quran-card overflow-hidden p-5 sm:p-7">
                <div className="rounded-2xl bg-[var(--primary-soft)] p-5 sm:p-7">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B49350]">
                        {t(
                          "Continue your journey",
                        )}
                      </p>

                      <h2 className="mt-2 text-2xl font-semibold text-[#17372C]">
                        {t(
                          "Continue Reading",
                        )}
                      </h2>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl">
                      📖
                    </div>
                  </div>

                  <SavedPosition
                    verseKey={
                      progress?.[0]
                        ?.verse_key
                    }
                    error={
                      !!progressError
                    }
                  />
                </div>
              </div>

              {/* DAILY GOAL */}
              <DailyGoal
                initialGoal={
                  dailyGoal
                }
              />
            </div>
          ) : (
            /*
             * SIGNED-OUT USER:
             * NO FAKE PROGRESS
             */
            <div className="quran-card overflow-hidden p-5 sm:p-7">
              <div className="rounded-2xl bg-[var(--primary-soft)] p-6 sm:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl">
                  📖
                </div>

                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#B49350]">
                  {t(
                    "Begin your journey",
                  )}
                </p>

                <h2 className="mt-2 text-3xl font-semibold text-[#17372C]">
                  {t(
                    "Read at your own pace.",
                  )}
                </h2>

                <p className="mt-4 leading-7 text-[var(--muted)]">
                  {t(
                    "Choose any Surah, read in Arabic or translation, listen to recitation, and continue as a guest or with your own account.",
                  )}
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="font-semibold text-[#17372C]">
                      {t(
                        "Guest Reading",
                      )}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {t(
                        "Read and listen without creating an account.",
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <p className="font-semibold text-[#17372C]">
                      {t(
                        "Account Journey",
                      )}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {t(
                        "Save progress, reflections, bookmarks, and reminders permanently.",
                      )}
                    </p>
                  </div>
                </div>

                <Link
                  href="/start"
                  className="quran-btn-primary mt-7 inline-flex w-full items-center justify-center"
                >
                  {t(
                    "Explore Reading Options",
                  )}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SIGNED-IN REAL PROGRESS */}
      {user && (
        <section className="border-t border-[var(--border)] bg-white py-12 sm:py-16">
          <div className="quran-container">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[var(--gold)]">
                  {t(
                    "Your journey",
                  )}
                </p>

                <h2 className="mt-2 text-3xl font-semibold">
                  {t(
                    "Your Qur’an Progress",
                  )}
                </h2>
              </div>

              <Link
                href="/progress"
                className="quran-btn-secondary"
              >
                {t(
                  "View Full Progress",
                )}
              </Link>
            </div>

            <div className="rounded-[24px] border border-[#315C4B]/10 bg-[#FAF9F5] p-6 shadow-sm">
              <SurahProgress
                records={
                  progress ?? []
                }
                error={
                  !!progressError
                }
              />
            </div>
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section
        className={`border-t border-[var(--border)] py-12 sm:py-16 ${
          user
            ? "bg-[var(--background)]"
            : "bg-white"
        }`}
      >
        <div className="quran-container">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--gold)]">
              {t(
                "Built for consistency",
              )}
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              {t(
                "Everything you need to keep reading.",
              )}
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              title={t(
                "Save Your Place",
              )}
              text={t(
                "Pause at any ayah and return to the exact place you stopped.",
              )}
            />

            <FeatureCard
              title={t(
                "Track Progress",
              )}
              text={t(
                "Follow your progress through Surahs and your complete Qur’an journey.",
              )}
            />

            <FeatureCard
              title={t(
                "Bookmarks",
              )}
              text={t(
                "Save meaningful ayat so you can easily return to them later.",
              )}
            />

            <FeatureCard
              title={t(
                "Reading Reminders",
              )}
              text={t(
                "Create a reading routine and schedule reminders to continue.",
              )}
            />
          </div>
        </div>
      </section>

      {/* DATABASE WARNING */}
      {user &&
        (profileError ||
          progressError) && (
          <section className="quran-container pb-8">
            <div className="journey-warning">
              {t(
                "Some journey information could not be loaded. Please refresh and try again.",
              )}
            </div>
          </section>
        )}

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] py-6">
        <nav aria-label={isArabic ? "روابط الموقع" : "Site links"} className="quran-container mb-4 flex justify-center gap-6 text-sm text-[var(--primary)]">
          <Link href="/about">{isArabic ? "عن التطبيق" : "About"}</Link>
          <Link href="/how-it-works">{isArabic ? "كيف يعمل" : "How It Works"}</Link>
        </nav>
        <div className="quran-container text-center text-sm text-[var(--muted)]">
          {t(
            "My Qur’an Journey",
          )}
        </div>
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

      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {text}
      </p>
    </div>
  );
}
