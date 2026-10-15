"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { readingDay, completedKeys, validDailyGoal } from "@/lib/reading-activity";
async function session() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error("Sign in required");
  return { db, user };
}
export async function updateDailyGoal(goal: number) {
  try {
    if (!validDailyGoal(goal)) return { error: "invalid_goal" };
    const { db, user } = await session();
    const { data, error } = await db.from("profiles").update({ daily_goal: goal }).eq("id", user.id).select("id");
    if (error || !data?.length) return { error: "save_failed" };
    revalidatePath("/protected");
    return { success: true };
  } catch { return { error: "save_failed" }; }
}
export async function getDailyReading(timeZone: string) {
  try {
    const day = readingDay(timeZone);
    const { db, user } = await session();
    const { count, error } = await db.from("journey_reading_days").select("verse_key", { count: "exact", head: true }).eq("user_id", user.id).eq("reading_date", day);
    if (error) return { error: "activity_unavailable" };
    return { count: count ?? 0, day };
  } catch { return { error: "activity_unavailable" }; }
}
export async function recordCompletedAyahs(surah: number, start: number, end: number, timeZone: string) {
  try {
    const keys = completedKeys(surah, start, end), day = readingDay(timeZone);
    const { db, user } = await session();
    const { error } = await db.from("journey_reading_days").upsert(keys.map(verse_key => ({ user_id: user.id, reading_date: day, verse_key })), { onConflict: "user_id,reading_date,verse_key", ignoreDuplicates: true });
    if (error) return { error: "activity_unavailable" };
    // DailyGoal reads fresh activity on mount/focus. Avoid refreshing the active reader after every verse.
    return { success: true };
  } catch { return { error: "activity_unavailable" }; }
}
