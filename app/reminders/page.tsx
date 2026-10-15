import { getI18n } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JourneyShell } from "@/components/journey-shell";
import { Reminders } from "@/components/reminders";

export default async function RemindersPage() {
  const { t } = await getI18n();

  const db = await createClient();

  const {
    data: { user },
  } = await db.auth.getUser();

  // Reminders are available only to signed-in users.
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <JourneyShell title={t("Reading reminders")}>
      <Reminders />
    </JourneyShell>
  );
}