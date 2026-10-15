import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] text-[#18392b]">
      {/* HERO */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#a8874f]">
          My Qur&apos;an Journey
        </p>

        <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
          Your Qur&apos;an Journey Starts Here
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#53635b] md:text-lg">
          My Qur&apos;an Journey keeps your reading, listening, saved progress,
          reminders, goals, and reflections together in one simple place.
        </p>
      </section>

      {/* STEPS */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="space-y-6">
          {/* STEP 1 */}
          <div className="rounded-[28px] border border-[#ece5d7] bg-white p-7 shadow-sm md:p-9">
            <div className="flex gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#18392b] font-semibold text-white">
                01
              </div>

              <div>
                <h2 className="text-2xl font-semibold">
                  Create your account
                </h2>

                <p className="mt-3 leading-7 text-[#66716b]">
                  Save your Qur&apos;an journey and keep your reading progress
                  connected to your account so you can return anytime.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="rounded-[28px] border border-[#ece5d7] bg-white p-7 shadow-sm md:p-9">
            <div className="flex gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#18392b] font-semibold text-white">
                02
              </div>

              <div>
                <h2 className="text-2xl font-semibold">
                  Choose a Surah
                </h2>

                <p className="mt-3 leading-7 text-[#66716b]">
                  Browse the 114 Surahs and choose where you would like to begin
                  or continue your Qur&apos;an reading.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="rounded-[28px] border border-[#ece5d7] bg-white p-7 shadow-sm md:p-9">
            <div className="flex gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#18392b] font-semibold text-white">
                03
              </div>

              <div>
                <h2 className="text-2xl font-semibold">
                  Read or listen
                </h2>

                <p className="mt-3 leading-7 text-[#66716b]">
                  Read Arabic text, view available translations, adjust the
                  reading view, or listen to Qur&apos;an recitation while
                  following along.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="rounded-[28px] border border-[#ece5d7] bg-white p-7 shadow-sm md:p-9">
            <div className="flex gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#18392b] font-semibold text-white">
                04
              </div>

              <div>
                <h2 className="text-2xl font-semibold">
                  Save &amp; continue later
                </h2>

                <p className="mt-3 leading-7 text-[#66716b]">
                  Save where you stopped so you can return directly to the same
                  ayah and continue your Qur&apos;an journey without searching
                  again.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 5 */}
          <div className="rounded-[28px] border border-[#ece5d7] bg-white p-7 shadow-sm md:p-9">
            <div className="flex gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#18392b] font-semibold text-white">
                05
              </div>

              <div>
                <h2 className="text-2xl font-semibold">
                  Set a reminder
                </h2>

                <p className="mt-3 leading-7 text-[#66716b]">
                  Choose a reminder time so My Qur&apos;an Journey can notify you
                  when it&apos;s time to return and continue reading later.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 6 */}
          <div className="rounded-[28px] border border-[#ece5d7] bg-white p-7 shadow-sm md:p-9">
            <div className="flex gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#18392b] font-semibold text-white">
                06
              </div>

              <div>
                <h2 className="text-2xl font-semibold">
                  Build your Qur&apos;an habit
                </h2>

                <p className="mt-3 leading-7 text-[#66716b]">
                  Set reading goals, track completed readings, monitor your
                  progress, and build a consistent connection with the
                  Qur&apos;an over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-[36px] bg-[#18392b] px-8 py-14 text-center text-white md:px-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d8bd84]">
            Continue your journey
          </p>

          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-tight md:text-5xl">
           Make Today Part of Your Journey
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-8 text-white/75">
            Read, listen, save your place, set a reminder, and continue building
            your connection with the Qur&apos;an one ayah at a time.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/quran"
              className="inline-flex rounded-full bg-white px-7 py-3.5 font-medium text-[#18392b] transition hover:bg-[#f4efe4]"
            >
              Start Reading Qur&apos;an
            </Link>

            <Link
              href="/progress"
              className="inline-flex rounded-full border border-white/30 px-7 py-3.5 font-medium text-white transition hover:bg-white/10"
            >
              View My Progress
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}