import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] text-[#18392b]">
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#a8874f]">
            My Qur&apos;an Journey
          </p>

          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            A companion for your Qur&apos;an journey
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#53635b] md:text-lg">
            A calm space to read, listen, reflect, and build a consistent
            connection with the Qur&apos;an — one ayah at a time.
          </p>

          <Link
            href="/quran"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#18392b] px-7 py-3.5 font-medium text-white transition hover:bg-[#244c3b]"
          >
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold">
            Everything you need for a meaningful journey
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-[#68746e]">
            Simple tools designed to help you stay connected with the Qur&apos;an
            consistently.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* CARD 1 */}
          <div className="rounded-[28px] border border-[#ece5d7] bg-white p-8 shadow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1eee4] text-2xl">
              📖
            </div>

            <h3 className="text-xl font-semibold">Read with ease</h3>

            <p className="mt-3 leading-7 text-[#66716b]">
              Read the Qur&apos;an with Arabic text and available translations,
              with comfortable reading controls designed for focused reading.
            </p>
          </div>

          {/* CARD 2 */}
          <div className="rounded-[28px] border border-[#ece5d7] bg-white p-8 shadow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1eee4] text-2xl">
              🎧
            </div>

            <h3 className="text-xl font-semibold">Listen &amp; follow</h3>

            <p className="mt-3 leading-7 text-[#66716b]">
              Listen to Qur&apos;an recitation and follow the ayat while building
              a deeper connection with every Surah.
            </p>
          </div>

          {/* CARD 3 */}
          <div className="rounded-[28px] border border-[#ece5d7] bg-white p-8 shadow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1eee4] text-2xl">
              🌿
            </div>

            <h3 className="text-xl font-semibold">Grow consistently</h3>

            <p className="mt-3 leading-7 text-[#66716b]">
              Set reading goals, return to where you stopped, and watch your
              Qur&apos;an journey grow over time.
            </p>
          </div>
        </div>
      </section>

      {/* MOTIVATIONAL SECTION */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-[36px] bg-[#18392b] px-8 py-14 text-center text-white md:px-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d8bd84]">
            Your journey matters
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
            A gentle journey, not a race.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl leading-8 text-white/75">
            Your progress does not need to look like anyone else&apos;s. Read at
            your own pace, return when you can, and continue building your
            connection with the Qur&apos;an.
          </p>

          <p className="mt-7 text-lg font-medium text-[#ead9ad]">
            Every ayah you read is part of your journey.
          </p>

          <Link
            href="/quran"
            className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 font-medium text-[#18392b] transition hover:bg-[#f4efe4]"
          >
            Continue My Journey
          </Link>
        </div>
      </section>
    </main>
  );
}