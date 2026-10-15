import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { parseVerseKey, positionPercent } from "@/lib/quran";
export async function SurahProgress({ records, error = false }: { records: { verse_key: string }[]; error?: boolean }) {
  const { language } = await getI18n(), ar = language === "ar";
  const positions = records.flatMap(record => { try { return [{ ...parseVerseKey(record.verse_key), key: record.verse_key }]; } catch { return []; } }).sort((a, b) => a.surah - b.surah);
  if (error) return <p role="alert">{ar ? "تعذّر تحميل تقدم القراءة. أعد المحاولة." : "Reading progress could not be loaded. Please retry."}</p>;
  if (!positions.length) return <p className="text-sm text-[var(--muted)]">{ar ? "لم يُحفظ تقدم في القراءة بعد." : "No reading progress has been saved yet."}</p>;
  return <ul className="divide-y">{positions.map(position => {
    const completed = position.ayah === position.chapter.verses_count;
    const percent = positionPercent(position.key);
    return <li key={position.surah} className="py-4 first:pt-0 last:pb-0"><Link href={`/quran/${position.surah}?ayah=${position.ayah}`} className="flex flex-wrap justify-between gap-3 font-semibold"><span>{ar ? `سورة ${position.chapter.name_arabic}` : `Surah ${position.chapter.name_simple}`}</span><span className="text-[#315C4B]">{percent}% {completed ? (ar ? "مكتملة" : "Completed") : (ar ? "قيد القراءة" : "Progress")}</span></Link><progress className="mt-3 w-full" value={position.ayah} max={position.chapter.verses_count} aria-label={ar ? position.chapter.name_arabic : position.chapter.name_simple} /></li>;
  })}</ul>;
}
