import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

import { ActiveNav } from "@/components/active-nav";
import { GuestSaveButton } from "@/components/guest-save-button";
import { GuestFeatureNav } from "@/components/guest-feature-nav";

export async function JourneyShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const {
    t,
    language,
  } = await getI18n();

  const isArabic =
    language === "ar";

  const db =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await db.auth.getUser();

  const cookieStore =
    await cookies();

  const isGuest =
    !user &&
    cookieStore.get(
      "quran_guest",
    )?.value === "true";

  const signedInItems = [
    {
      href: "/quran",
      label: isArabic
        ? "📖 القرآن"
        : "📖 Qur'an",
    },
    {
      href: "/progress",
      label: isArabic
        ? "◷ التقدم"
        : "◷ Progress",
    },
    {
      href: "/reflections",
      label: isArabic
        ? "✦ التأملات"
        : "✦ Reflections",
    },
    {
      href: "/bookmarks",
      label: isArabic
        ? "🔖 الإشارات المرجعية"
        : "🔖 Bookmarks",
    },
    {
      href: "/reminders",
      label: isArabic
        ? "◷ التذكيرات"
        : "◷ Reminders",
    },
    {
      href: "/protected",
      label: isArabic
        ? "⌂ لوحة التحكم"
        : "⌂ Dashboard",
    },
  ];

  const publicItems = [
    {
      href: "/quran",
      label: isArabic
        ? "📖 القرآن"
        : "📖 Qur'an",
    },
  ];

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-[#FAF9F5]"
    >
      <header className="sticky top-0 z-50 border-b border-[#315C4B]/10 bg-white/95 shadow-sm backdrop-blur">
        <div className="quran-container flex items-center justify-between gap-4 py-4">
          {/* BRAND */}
          <Link
            href={
              user
                ? "/protected"
                : "/start"
            }
            className="shrink-0 text-xl font-bold text-[#17372C] transition hover:text-[#315C4B]"
          >
            {isArabic
              ? "رحلتي مع القرآن"
              : "My Qur'an Journey"}
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav
            aria-label={t(
              "Main navigation",
            )}
            className="hidden items-center gap-2 text-base font-semibold lg:flex"
          >
            {user ? (
              <ActiveNav
                items={
                  signedInItems
                }
              />
            ) : (
              <ActiveNav
                items={
                  publicItems
                }
              />
            )}

            {/* DESKTOP GUEST CONTROLS */}
            {isGuest && (
              <>
                <span className="rounded-full bg-[#F5EEDC] px-4 py-2 text-sm font-medium text-[#8A6D35]">
                  {isArabic
                    ? "ضيف"
                    : "Guest"}
                </span>

                <GuestFeatureNav
                  isArabic={
                    isArabic
                  }
                />

                <Link
                  href="/auth/sign-up"
                  className="rounded-xl border border-[#315C4B] px-4 py-3 text-[#315C4B] transition hover:bg-[#F3EEE2]"
                >
                  {isArabic
                    ? "إنشاء حساب"
                    : "Create Account"}
                </Link>

                <Link
                  href="/auth/login"
                  className="rounded-xl bg-[#315C4B] px-4 py-3 text-white transition hover:bg-[#264A3D]"
                >
                  {isArabic
                    ? "تسجيل الدخول"
                    : "Sign In"}
                </Link>
              </>
            )}
          </nav>

          {/* MOBILE NAVIGATION */}
          <details className="group relative lg:hidden">
            <summary
              aria-label={
                isArabic
                  ? "فتح القائمة"
                  : "Open navigation menu"
              }
              className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-[#315C4B]/20 bg-white text-[#17372C] transition hover:bg-[#F3EEE2] [&::-webkit-details-marker]:hidden"
            >
              <span className="text-2xl leading-none group-open:hidden">
                ☰
              </span>

              <span className="hidden text-2xl leading-none group-open:inline">
                ×
              </span>
            </summary>

            <div
              className={`absolute top-14 z-50 w-[290px] rounded-2xl border border-[#315C4B]/10 bg-white p-3 shadow-xl ${
                isArabic
                  ? "left-0"
                  : "right-0"
              }`}
            >
              <div className="flex flex-col gap-1 text-base font-semibold">
                {user ? (
                  <ActiveNav
                    items={
                      signedInItems
                    }
                  />
                ) : (
                  <ActiveNav
                    items={
                      publicItems
                    }
                  />
                )}

                {/* MOBILE GUEST CONTROLS */}
                {isGuest && (
                  <>
                    <div className="my-2 border-t border-[#315C4B]/10" />

                    <span className="mx-2 w-fit rounded-full bg-[#F5EEDC] px-4 py-2 text-sm font-medium text-[#8A6D35]">
                      {isArabic
                        ? "ضيف"
                        : "Guest"}
                    </span>

                    <GuestFeatureNav
                      isArabic={
                        isArabic
                      }
                    />

                    <div className="my-2 border-t border-[#315C4B]/10" />

                    <Link
                      href="/auth/sign-up"
                      className="rounded-xl border border-[#315C4B] px-4 py-3 text-center text-[#315C4B] transition hover:bg-[#F3EEE2]"
                    >
                      {isArabic
                        ? "إنشاء حساب"
                        : "Create Account"}
                    </Link>

                    <Link
                      href="/auth/login"
                      className="rounded-xl bg-[#315C4B] px-4 py-3 text-center text-white transition hover:bg-[#264A3D]"
                    >
                      {isArabic
                        ? "تسجيل الدخول"
                        : "Sign In"}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </details>
        </div>
      </header>

      <section className="quran-container py-8">
        {title && (
          <h1 className="mb-6 text-3xl font-semibold text-[#17372C]">
            {title}
          </h1>
        )}

        {/* GUEST NOTICE */}
        {isGuest && (
          <div className="mb-6 rounded-[20px] border border-[#D6B46B]/40 bg-[#FFF9EC] px-5 py-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-[#17372C]">
                  {isArabic
                    ? "أنت تقرأ كضيف"
                    : "You're reading as a guest"}
                </p>

                <p className="mt-1 text-sm leading-6 text-[#65716B]">
                  {isArabic
                    ? "يتم حفظ موضع قراءتك مؤقتًا خلال هذه الجلسة. أنشئ حسابًا أو سجّل الدخول لحفظ تقدمك بشكل دائم وإضافة التأملات والإشارات المرجعية والتذكيرات والمتابعة في زياراتك القادمة."
                    : "Your reading position is saved temporarily during this session. Create an account or sign in to save progress permanently, add reflections, bookmarks and reminders, and continue on future visits."}
                </p>
              </div>

              <GuestSaveButton
                label={
                  isArabic
                    ? "احفظ رحلتي"
                    : "Save My Journey"
                }
                savedLabel={
                  isArabic
                    ? "تم الحفظ لهذه الجلسة ✓"
                    : "Saved for this session ✓"
                }
              />
            </div>
          </div>
        )}

        {children}
      </section>
    </main>
  );
}