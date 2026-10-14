import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { JourneyShell } from "@/components/journey-shell";
import { SavedPosition } from "@/components/saved-position";
import { LogoutButton } from "@/components/logout-button";

export default async function ProtectedPage() {
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
      .select("verse_key")
      .eq("user_id", user.id)
      .maybeSingle(),

   db
  .from("journey_reflections")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user.id),
  ]);

  if (!profile && !profileError) redirect("/onboarding");

  const firstName =
    profile?.full_name?.split(" ")[0] || "Reader";

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
              MY QUR&apos;AN JOURNEY
            </p>

            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              Assalāmu ʿalaykum,
              <br />
              {firstName}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 md:text-base">
              A little progress each day becomes a beautiful journey.
              Read, reflect, and continue at your own pace.
            </p>
          </div>
        </section>

        {/* CONTINUE + JOURNEY */}
        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">

          <div className="rounded-[24px] border border-[#315C4B]/10 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B49350]">
                  Continue your journey
                </p>

                <h2 className="mt-1 text-2xl font-semibold text-[#17372C]">
                  Continue Reading
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EEDC] text-xl">
                📖
              </div>
            </div>

            <SavedPosition
              verseKey={progress?.verse_key}
              error={!!progressError}
            />
          </div>

          <div className="rounded-[24px] bg-[#F3EEE2] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A6D35]">
              Today&apos;s goal
            </p>

            <div className="mt-5 flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[8px] border-[#315C4B] bg-white">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#315C4B]">
                    {dailyGoal}
                  </div>
                  <div className="text-[10px] uppercase text-gray-500">
                    Ayat
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[#17372C]">
                  Daily Reading
                </h2>

                <p className="mt-1 text-sm leading-5 text-gray-600">
                  Your daily goal is {dailyGoal} ayat.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">Saved position</p>
            <p className="mt-2 text-xl font-semibold text-[#315C4B]">
              {progress?.verse_key || "Not started"}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
           <p className="text-sm text-gray-500">Reflections</p>
            <p className="mt-2 text-2xl font-semibold text-[#315C4B]">
             {reflectionError ? "—" : reflectionCount || 0}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border bg-white p-5 md:col-span-1">
            <p className="text-sm text-gray-500">Daily goal</p>
            <p className="mt-2 text-2xl font-semibold text-[#315C4B]">
              {dailyGoal} ayat
            </p>
          </div>
        </section>

        {/* QUICK ACCESS */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[#17372C]">
              Quick Access
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Everything you need for your Qur&apos;an journey.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              href="/quran"
              className="group rounded-[22px] border bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-2xl">📖</div>
              <h3 className="font-semibold text-[#17372C]">Qur&apos;an</h3>
              <p className="mt-1 text-sm text-gray-500">
                Browse and continue reading
              </p>
            </Link>

            <Link
              href="/progress"
              className="group rounded-[22px] border bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-2xl">◔</div>
              <h3 className="font-semibold text-[#17372C]">Progress</h3>
              <p className="mt-1 text-sm text-gray-500">
                View your saved position
              </p>
            </Link>

            <Link
              href="/reflections"
              className="group rounded-[22px] border bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-2xl">🔖</div>
              <h3 className="font-semibold text-[#17372C]">Reflections</h3>
              <p className="mt-1 text-sm text-gray-500">
               Write and revisit your Qur’an reflections
              </p>
            </Link>

            <Link
              href="/reminders"
              className="group rounded-[22px] border bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-2xl">◷</div>
              <h3 className="font-semibold text-[#17372C]">Reminders</h3>
              <p className="mt-1 text-sm text-gray-500">
                Plan your reading time
              </p>
            </Link>

          </div>
        </section>

        <div className="flex justify-end border-t pt-5">
          <LogoutButton />
        </div>

      </div>
    </JourneyShell>
  );
}