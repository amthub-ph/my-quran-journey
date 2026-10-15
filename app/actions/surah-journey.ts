"use server";
import { createClient } from "@/lib/supabase/server";
import { parseVerseKey } from "@/lib/quran";
import { revalidatePath } from "next/cache";
export async function saveSurahJourney(key: string, mode: string = "save") {
 try {
  const position = parseVerseKey(key);
  if (!["save", "complete", "restart"].includes(mode) || (mode === "complete" && position.ayah !== position.chapter.verses_count) || (mode === "restart" && position.ayah !== 1)) return { error: "Invalid reading operation." };
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  const { error } = await db.rpc("journey_save_reading", { p_key: key, p_mode: mode });
  if (error) return { error: "Reading progress could not be saved. Please check the database setup and retry." };
  revalidatePath("/progress"); revalidatePath("/protected");
  return { success: true };
 } catch { return { error: "Reading progress could not be saved. Please retry." }; }
}
