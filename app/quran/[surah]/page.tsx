import { notFound, redirect } from "next/navigation";
import { chapters } from "@/lib/quran";
import { arabicText } from "@/lib/quran-server";
import { createClient } from "@/lib/supabase/server";
import { Reader } from "@/components/reader";
import { JourneyShell } from "@/components/journey-shell";
import { getI18n } from "@/lib/i18n/server";
export default async function ReaderPage({params,searchParams}:{params:Promise<{surah:string}>;searchParams:Promise<{ayah?:string}>}) {
  const {language} = await getI18n();
  const {surah}=await params, {ayah}=await searchParams;
  const chapter=chapters.find(c=>String(c.id)===surah);
  if(!chapter) notFound();
  const number=Number(ayah || 1);
  if(!Number.isInteger(number)||number<1||number>chapter.verses_count) notFound();
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user) redirect("/auth/login");
  const {data:profile}=await db.from("profiles").select("quran_display").eq("id",user.id).maybeSingle();
  const text=await arabicText();
  const verses=Array.from({length:chapter.verses_count},(_,i)=>({key:`${surah}:${i+1}`,arabic:text.get(`${surah}:${i+1}`)!}));
 return <JourneyShell title={language === "ar" ? chapter.name_arabic : chapter.name_simple}><Reader key={`${surah}:${number}`} surah={chapter.id} initialAyah={number} verses={verses} initialLanguage={profile?.quran_display === "arabic" ? "arabic" : profile?.quran_display === "arabic_tagalog" ? "tagalog" : "english"} databaseWarning={false}/></JourneyShell>;
}
