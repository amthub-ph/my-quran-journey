import { getI18n } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JourneyShell } from "@/components/journey-shell";
import { SurahJourney } from "@/components/surah-journey";
export default async function ProgressPage() {
  const { t, language } = await getI18n();
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data, error } = await db.from("journey_progress").select("verse_key,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  const [stateResult, completionResult] = await Promise.all([
    db.from("journey_surah_state").select("surah,completions,in_progress").eq("user_id", user.id),
    db.from("journey_surah_completions").select("surah,reading_number,completed_at").eq("user_id", user.id).order("reading_number", { ascending: false }),
  ]);
  return <JourneyShell title={t("Reading progress")}><div className="mx-auto max-w-3xl space-y-8"><SurahJourney records={data ?? []} states={stateResult.data ?? []} completions={completionResult.data ?? []} error={!!error || !!stateResult.error || !!completionResult.error} language={language} /></div></JourneyShell>;
}
