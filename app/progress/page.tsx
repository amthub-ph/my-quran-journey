import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JourneyShell } from "@/components/journey-shell";
import { parseVerseKey, positionPercent } from "@/lib/quran";

export default async function ProgressPage() {
  const db = await createClient();

  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await db
    .from("journey_progress")
    .select("surah, ayah, verse_key, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const validProgress =
    data?.filter(
      (item) =>
        item.surah !== null &&
        item.ayah !== null &&
        item.verse_key
    ) ?? [];

  const positions = validProgress
    .map((item) => {
      try {
        return {
          ...item,
          position: parseVerseKey(item.verse_key),
        };
      } catch {
        return null;
      }
    })
    .filter(
      (
        item
      ): item is NonNullable<typeof item> => item !== null
    );

 const latest = positions.find(
  (item) => positionPercent(item.verse_key) < 100
);

  return (
    <JourneyShell title="Reading progress">
      <div className="mx-auto max-w-3xl space-y-8">

        {error && (
          <div className="journey-warning" role="alert">
            Saved progress could not be loaded. Please try again.
          </div>
        )}

        {latest ? (
          <section className="quran-card p-6">
            <p className="text-sm text-[var(--muted)]">
              Continue where you left off
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              {latest.position.chapter.name_simple}
            </h2>

            <p
              className="arabic-text mt-2 text-2xl"
              lang="ar"
              dir="rtl"
            >
              {latest.position.chapter.name_arabic}
            </p>

            <p className="mt-4">
              Ayah {latest.position.ayah} of{" "}
              {latest.position.chapter.verses_count}
            </p>

            <progress
              className="w-full my-3"
              max={latest.position.chapter.verses_count}
              value={latest.position.ayah}
              aria-label="Latest reading progress"
            />

            <p className="text-sm text-[var(--muted)]">
              {positionPercent(latest.verse_key)}% through this Surah
            </p>

            <Link
              className="quran-btn-primary mt-5 inline-block"
              href={`/quran/${latest.position.surah}?ayah=${latest.position.ayah}`}
            >
              Continue Reading
            </Link>
          </section>
        ) : (
          <section className="quran-card p-6">
            <h2 className="text-2xl font-semibold">
              Begin your journey
            </h2>

            <p className="mt-4">
              No reading progress has been saved yet.
            </p>

            <Link
              className="quran-btn-primary mt-5 inline-block"
              href="/quran"
            >
              Choose a Surah
            </Link>
          </section>
        )}

        {positions.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-semibold">
              Your Surahs
            </h2>

            <div className="space-y-4">
              {positions.map((item) => {
  const { position } = item;
  const completed = positionPercent(item.verse_key) === 100;

  if (completed) {
    return (
      <div
        key={item.surah}
        className="quran-card flex items-center justify-between gap-4 px-5 py-4"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold">
            {position.chapter.name_simple}
          </span>

          <span
            className="arabic-text text-lg"
            lang="ar"
            dir="rtl"
          >
            {position.chapter.name_arabic}
          </span>

          <span className="text-sm text-[var(--muted)]">
            {position.chapter.verses_count} Ayat
          </span>
        </div>

        <span className="shrink-0 font-semibold text-green-700">
          ✓ Completed
        </span>
      </div>
    );
  }

  return (
    <div
      key={item.surah}
      className="quran-card p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">
            {position.chapter.name_simple}
          </h3>

          <p
            className="arabic-text mt-1 text-xl"
            lang="ar"
            dir="rtl"
          >
            {position.chapter.name_arabic}
          </p>

          <p className="mt-3">
            Ayah {position.ayah} of{" "}
            {position.chapter.verses_count}
          </p>
        </div>

        <strong>
          {positionPercent(item.verse_key)}%
        </strong>
      </div>

      <progress
        className="w-full my-3"
        max={position.chapter.verses_count}
        value={position.ayah}
        aria-label={`${position.chapter.name_simple} reading progress`}
      />

      <Link
        className="quran-btn-primary inline-block"
        href={`/quran/${position.surah}?ayah=${position.ayah}`}
      >
        Continue Reading
      </Link>
    </div>
  );
})}
            </div>
          </section>
        )}
      </div>
    </JourneyShell>
  );
}