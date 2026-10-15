import { getI18n } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JourneyShell } from "@/components/journey-shell";
import { SavedPosition } from "@/components/saved-position";
import { SurahProgress } from "@/components/surah-progress";
export default async function ProgressPage() {
  const { t } = await getI18n();
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data, error } = await db.from("journey_progress").select("verse_key,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  return <JourneyShell title={t("Reading progress")}><div className="mx-auto max-w-3xl space-y-8"><section><h2 className="mb-4 text-2xl font-semibold">{t("Continue Reading")}</h2><SavedPosition verseKey={data?.[0]?.verse_key} error={!!error} /></section><section className="quran-card p-6 space-y-5"><h2 className="text-2xl font-semibold">{t("Your Surahs")}</h2><SurahProgress records={data ?? []} error={!!error} /></section></div></JourneyShell>;
}
