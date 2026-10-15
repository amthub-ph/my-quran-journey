"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/language-provider";

export default function StartPage() {
  const router = useRouter();
  const { language } = useI18n();

  const isArabic = language === "ar";

  function continueAsGuest() {
    document.cookie =
      "quran_guest=true; path=/; SameSite=Lax";

    router.push("/quran");
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f8f4ea] px-6 py-16 text-[#18392b]"
    >
      <section className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#a8874f]">
            {isArabic
              ? "رحلتي مع القرآن"
              : "My Qur'an Journey"}
          </p>

          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            {isArabic
              ? "ابدأ رحلتك مع القرآن"
              : "Begin Your Qur'an Journey"}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#53635b] md:text-lg">
            {isArabic
              ? "اختر الطريقة التي ترغب في المتابعة بها. أنشئ حسابًا لحفظ رحلتك وتقدمك، أو تابع كضيف خلال هذه الجلسة."
              : "Choose how you would like to continue. Create an account to keep your journey saved, or continue as a guest for this session."}
          </p>
        </div>

        {/* OPTIONS */}
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* CREATE ACCOUNT */}
          <div className="rounded-[30px] border border-[#e8dfcf] bg-white p-8 shadow-sm md:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1eee4] text-2xl">
              🌿
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8874f]">
              {isArabic ? "موصى به" : "Recommended"}
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              {isArabic
                ? "احفظ رحلتك مع القرآن"
                : "Save Your Qur'an Journey"}
            </h2>

            <p className="mt-4 leading-7 text-[#66716b]">
              {isArabic
                ? "أنشئ حسابًا لحفظ تقدمك ومتابعة رحلتك من حيث توقفت كلما عدت."
                : "Create an account to keep your progress saved and continue your journey whenever you return."}
            </p>

            <ul className="mt-6 space-y-3 text-sm leading-6 text-[#53635b]">
              <li>
                ✓{" "}
                {isArabic
                  ? "احفظ الموضع الذي توقفت عنده"
                  : "Save where you stopped"}
              </li>

              <li>
                ✓{" "}
                {isArabic
                  ? "تابع من آخر آية قرأتها"
                  : "Continue from your last ayah"}
              </li>

              <li>
                ✓{" "}
                {isArabic
                  ? "تابع تقدمك في السور والقراءة"
                  : "Track Surah and reading progress"}
              </li>

              <li>
                ✓{" "}
                {isArabic
                  ? "احفظ العلامات والتأملات"
                  : "Save bookmarks and reflections"}
              </li>

              <li>
                ✓{" "}
                {isArabic
                  ? "حدد أهداف القراءة والتذكيرات"
                  : "Set reading goals and reminders"}
              </li>
            </ul>

            <Link
              href="/auth/sign-up"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#18392b] px-7 py-3.5 font-medium text-white transition hover:bg-[#244c3b]"
            >
              {isArabic
                ? "إنشاء حساب"
                : "Create Account"}
            </Link>
          </div>

          {/* GUEST */}
          <div className="rounded-[30px] border border-[#e8dfcf] bg-white p-8 shadow-sm md:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1eee4] text-2xl">
              📖
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8874f]">
              {isArabic
                ? "لا يحتاج إلى حساب"
                : "No account needed"}
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              {isArabic
                ? "المتابعة كضيف"
                : "Continue as Guest"}
            </h2>

            <p className="mt-4 leading-7 text-[#66716b]">
              {isArabic
                ? "ابدأ القراءة مباشرة دون إنشاء حساب."
                : "Start reading immediately without creating an account."}
            </p>

            <div className="mt-6 rounded-2xl bg-[#faf7f0] p-5">
              <p className="text-sm leading-6 text-[#66716b]">
                {isArabic
                  ? "تقدم الضيف مؤقت. لن يتم حفظ موضع القراءة أو التقدم أو العلامات أو الأهداف أو التذكيرات أو التأملات بشكل دائم عند المغادرة."
                  : "Guest progress is temporary. Your reading position, progress, bookmarks, goals, reminders, and reflections will not be permanently saved when you leave."}
              </p>
            </div>

            <button
              type="button"
              onClick={continueAsGuest}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-[#18392b] px-7 py-3.5 font-medium text-[#18392b] transition hover:bg-[#18392b] hover:text-white"
            >
              {isArabic
                ? "المتابعة كضيف"
                : "Continue as Guest"}
            </button>
          </div>
        </div>

        {/* RETURNING USER */}
        <div className="mx-auto mt-8 max-w-4xl rounded-[28px] bg-[#18392b] px-7 py-8 text-center text-white md:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8bd84]">
            {isArabic
              ? "هل تعود لمتابعة رحلتك؟"
              : "Returning to your journey?"}
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            {isArabic
              ? "لديك حساب بالفعل؟"
              : "Already have an account?"}
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-white/75">
            {isArabic
              ? "سجّل الدخول قبل المتابعة حتى تتمكن من العودة إلى تقدمك المحفوظ والمتابعة من حيث توقفت."
              : "Sign in before continuing so you can return to your saved progress and continue from where you left off."}
          </p>

          <Link
            href="/auth/login"
            className="mt-6 inline-flex rounded-full bg-white px-7 py-3.5 font-medium text-[#18392b] transition hover:bg-[#f4efe4]"
          >
            {isArabic
              ? "تسجيل الدخول والمتابعة"
              : "Sign In & Continue"}
          </Link>
        </div>

        {/* NOTE */}
        <p className="mx-auto mt-7 max-w-2xl text-center text-sm leading-6 text-[#78817c]">
          {isArabic
            ? "إذا كنت قد أنشأت حسابًا من قبل، فسجّل الدخول بدلًا من المتابعة كضيف حتى تتم استعادة رحلتك السابقة مع القرآن."
            : "If you have created an account before, sign in instead of continuing as a guest so your previous Qur'an journey can be restored."}
        </p>
      </section>
    </main>
  );
}