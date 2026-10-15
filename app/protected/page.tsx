import { getI18n } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { JourneyShell } from "@/components/journey-shell";
import { DailyGoal } from "@/components/daily-goal";
import { SurahProgress } from "@/components/surah-progress";
import { SavedPosition } from "@/components/saved-position";
import { LogoutButton } from "@/components/logout-button";

export default async function ProtectedPage() {
const { t } = await getI18n();

  const db = await createClient();

  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { data: profile, error: profileError },
    { data: progress, error: progressError },
    { count: reflectionCount, error: reflectionError },
  ] = await Promise.all([
    db
      .from("profiles")
      .select("full_name,daily_goal")
      .eq("id", user.id)
      .maybeSingle(),

    db
      .from("journey_progress")
      .select("verse_key,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),

   db
  .from("journey_reflections")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id),
  ]);

  if (!profile && !profileError) redirect("/onboarding");

  const firstName =
    profile?.full_name?.split(" ")[0] || t("Reader");

  const dailyGoal = profile?.daily_goal || 10;

  return (
    <JourneyShell>
      <div className="space-y-7">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#315C4B] px-6 py-8 text-white shadow-sm md:px-9 md:py-10">
          <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full border border-[#D6B46B]/30" />
          <div className="absolute -right-2 -top-6 h-36 w-36 rounded-full border border-[#D6B46B]/20" />

          <div className="relative max-w-2xl">
            <p className="mb-2 text-sm font-medium tracking-wide text-[#E8D29B]">
              {t("MY QUR'AN JOURNEY")}{" "}</p>

            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              {t("Assalāmu ʿalaykum,")}{" "}<br />
              {firstName}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 md:text-base">
              {t("A little progress each day becomes a beautiful journey. Read, reflect, and continue at your own pace.")}{" "}</p>
          </div>
        </section>

        {/* CONTINUE + JOURNEY */}
        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">

          <div className="rounded-[24px] border border-[#315C4B]/10 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B49350]">
                  {t("Continue your journey")}{" "}</p>

                <h2 className="mt-1 text-2xl font-semibold text-[#17372C]">
                  {t("Continue Reading")}{" "}</h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EEDC] text-xl">
                📖
              </div>
            </div>

            <SavedPosition
              verseKey={progress?.[0]?.verse_key}
              error={!!progressError}
            />
          </div>

          <DailyGoal initialGoal={dailyGoal} />
        </section>

        <section className="rounded-[24px] border bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold text-[#17372C]">{t("Progress")}</h2><Link href="/progress" className="quran-btn-secondary">{t("Progress")}</Link></div>
          <SurahProgress records={progress ?? []} error={!!progressError} />
        </section>
        <Link href="/progress" className="quran-btn-secondary inline-flex items-center gap-3"><span>{t("Reflections")}</span><span className="rounded-full bg-[#e8f0ec] px-3 py-1 font-semibold text-[#315C4B]">{reflectionError ? "—" : reflectionCount || 0}</span></Link>

        <div className="flex justify-end border-t pt-5">
          <LogoutButton />
        </div>

      </div>
    </JourneyShell>
  );
}