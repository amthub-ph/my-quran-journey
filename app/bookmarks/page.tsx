import { getI18n } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JourneyShell } from "@/components/journey-shell";
import { BookmarkList } from "@/components/bookmark-list";
export default async function BookmarksPage(){
const { t } = await getI18n();
const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/auth/login");const {data,error}=await db.from("journey_bookmarks").select("verse_key").eq("user_id",user.id).order("created_at",{ascending:false});return <JourneyShell title={t("Bookmarks")}>{error?<p role="alert">{t("Bookmarks could not be loaded. Check your connection and database setup.")}</p>:<BookmarkList keys={(data||[]).map(row=>row.verse_key)}/>}</JourneyShell>;}
