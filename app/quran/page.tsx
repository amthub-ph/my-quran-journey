import { getI18n } from "@/lib/i18n/server";
import { JourneyShell } from "@/components/journey-shell";
import { SurahList } from "@/components/surah-list";
export default async function QuranPage() {
const { t } = await getI18n();
 return <JourneyShell title={t("The Qur’an")}><SurahList /></JourneyShell>; }
