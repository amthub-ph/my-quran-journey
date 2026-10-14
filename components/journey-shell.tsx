import Link from "next/link";

export function JourneyShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#FAF9F5]">
      <header className="border-b border-[#315C4B]/10 bg-white shadow-sm">
        <div className="quran-container flex flex-wrap items-center justify-between gap-4 py-5">
          <Link
            href="/protected"
            className="text-xl font-bold text-[#17372C] transition hover:text-[#315C4B]"
          >
            My Qur&apos;an Journey
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-2 text-base font-semibold"
          >
            <Link
              href="/quran"
              className="rounded-xl px-4 py-3 text-[#17372C] transition hover:bg-[#F3EEE2] hover:text-[#315C4B]"
            >
              📖 Qur&apos;an
            </Link>

            <Link
              href="/progress"
              className="rounded-xl px-4 py-3 text-[#17372C] transition hover:bg-[#F3EEE2] hover:text-[#315C4B]"
            >
              ◔ Progress
            </Link>

            <Link
              href="/reflections"
              className="rounded-xl px-4 py-3 text-[#17372C] transition hover:bg-[#F3EEE2] hover:text-[#315C4B]"
            >
              ✦ Reflections
            </Link>

            <Link
              href="/reminders"
              className="rounded-xl px-4 py-3 text-[#17372C] transition hover:bg-[#F3EEE2] hover:text-[#315C4B]"
            >
              ◷ Reminders
            </Link>

            <Link
              href="/protected"
              className="rounded-xl bg-[#315C4B] px-4 py-3 text-white transition hover:bg-[#264A3D]"
            >
              ⌂ Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <section className="quran-container py-8">
        {title && (
          <h1 className="mb-6 text-3xl font-semibold text-[#17372C]">
            {title}
          </h1>
        )}

        {children}
      </section>
    </main>
  );
}