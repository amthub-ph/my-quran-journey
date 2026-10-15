import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { chapters } from "@/lib/quran";
import { arabicText } from "@/lib/quran-server";
import { createClient } from "@/lib/supabase/server";
import { Reader } from "@/components/reader";
import { JourneyShell } from "@/components/journey-shell";
import { getI18n } from "@/lib/i18n/server";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ surah: string }>;
  searchParams: Promise<{ ayah?: string }>;
}) {
  const { language } = await getI18n();

  const { surah } = await params;
  const { ayah } = await searchParams;

  const chapter = chapters.find((c) => String(c.id) === surah);

  if (!chapter) notFound();

  const number = Number(ayah || 1);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > chapter.verses_count
  ) {
    notFound();
  }

  const db = await createClient();

  const {
    data: { user },
  } = await db.auth.getUser();

  // Check whether this visitor explicitly selected Guest Mode.
  const cookieStore = await cookies();
  const guestAccess =
    !user && cookieStore.get("quran_guest")?.value === "true";

  // Not signed in and did not choose guest access.
  if (!user && !guestAccess) {
    redirect("/start");
  }

  // Existing signed-in profile behaviour stays unchanged.
  let profile: { quran_display?: string | null } | null = null;

  if (user) {
    const { data } = await db
      .from("profiles")
      .select("quran_display")
      .eq("id", user.id)
      .maybeSingle();

    profile = data;
  }

  const text = await arabicText();

  const verses = Array.from(
    { length: chapter.verses_count },
    (_, i) => ({
      key: `${surah}:${i + 1}`,
      arabic: text.get(`${surah}:${i + 1}`)!,
    }),
  );

  const initialLanguage =
    profile?.quran_display === "arabic"
      ? "arabic"
      : profile?.quran_display === "arabic_tagalog"
        ? "tagalog"
        : "english";

  return (
    <JourneyShell
      title={language === "ar" ? chapter.name_arabic : chapter.name_simple}
    >
      <Reader
        key={`${surah}:${number}`}
        surah={chapter.id}
        initialAyah={number}
        verses={verses}
        initialLanguage={initialLanguage}
        databaseWarning={false}
        isGuest={guestAccess}
      />
    </JourneyShell>
  );
}