import { getI18n } from "@/lib/i18n/server";
import { JourneyShell } from "@/components/journey-shell";
import { Reminders } from "@/components/reminders";
export default async function RemindersPage(){
const { t } = await getI18n();
return <JourneyShell title={t("Reading reminders")}><Reminders/></JourneyShell>;}
