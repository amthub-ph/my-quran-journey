import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { parseVerseKey, positionPercent } from "@/lib/quran";
export async function SavedPosition({verseKey,error}:{verseKey?:string;error?:boolean}) {
const { t, language } = await getI18n();

  let position;try{if(verseKey)position=parseVerseKey(verseKey);}catch{/* Treat invalid legacy state as unavailable. */}
  if(error)return <div className="quran-card p-6"><p role="alert">{t("Saved progress could not be loaded. Check the database setup and connection.")}</p><Link className="underline" href="/quran">{t("Browse surahs")}</Link></div>;
  if(!position)return <div className="quran-card p-6"><h2 className="text-2xl font-semibold">{t("Begin your journey")}</h2><p className="my-4">{t("No saved position yet. Use Pause & Save in the reader.")}</p><Link className="quran-btn-primary inline-block" href="/quran">{t("Choose a surah")}</Link></div>;
  return <div className="quran-card p-6"><h2 className="text-2xl font-semibold mt-2">{language === "ar" ? position.chapter.name_arabic : position.chapter.name_simple}</h2><p className="mt-4">{t("Ayah")}{" "}{position.ayah} / {position.chapter.verses_count} · {positionPercent(verseKey!)}%</p><progress className="w-full my-3" aria-label={t("Saved position within surah")} max={position.chapter.verses_count} value={position.ayah}/><Link className="quran-btn-primary inline-block" href={`/quran/${position.surah}?ayah=${position.ayah}`}>{t("Resume from Ayah")}{" "}{position.ayah}</Link></div>;
}
