"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { chapters, parseVerseKey } from "@/lib/quran";
import { saveReaderPosition } from "@/lib/save-reader-position";
export type Completion = { surah: number; reading_number: number; completed_at: string | null };
export function SurahJourney({ records, states, completions, error, language }: { records: { verse_key: string }[]; states: { surah: number; completions: number; in_progress: boolean }[]; completions: Completion[]; error: boolean; language: string }) {
 const ar = language === "ar", [mounted, setMounted] = useState(false), [pending, setPending] = useState<number | null>(null), [message, setMessage] = useState("");
 useEffect(() => setMounted(true), []);
 const ongoing = records.flatMap(record => { try { const p = parseVerseKey(record.verse_key), state = states.find(s => s.surah === p.surah); return state?.in_progress === false ? [] : [{ ...p, count: state?.completions ?? 0 }]; } catch { return []; } });
 const completed = states.filter(s => s.completions > 0).sort((a,b) => a.surah-b.surah);
 const name = (id: number) => { const chapter = chapters.find(c => c.id === id)!; return ar ? chapter.name_arabic : chapter.name_simple; };
 async function restart(surah: number) {
  setPending(surah); setMessage("");
  try { const result = await saveReaderPosition(surah + ":1", "restart"); if (result.error) throw new Error(result.error); window.location.href = "/quran/" + surah + "?ayah=1"; }
  catch { setMessage(ar ? "تعذّر بدء قراءة جديدة. أعد المحاولة." : "Could not start a new reading. Please retry."); setPending(null); }
 }
 if (error) return <p role="alert">{ar ? "تعذّر تحميل سجل القراءة. أعد المحاولة." : "Reading history could not be loaded. Please check the database setup and retry."}</p>;
 return <>
 <section className="quran-card p-6 space-y-5"><h2 className="text-sm font-normal text-[var(--muted)]">{ar ? "متابعة القراءة" : "Continue reading"}</h2>
 {!ongoing.length && <p className="text-sm text-[var(--muted)]">{ar ? "لا توجد سور قيد القراءة حاليًا." : "No surahs currently in progress."}</p>}
 <ul className="divide-y">{ongoing.map(p => <li key={p.surah} className="py-4"><Link href={"/quran/" + p.surah + "?ayah=" + p.ayah} className="flex justify-between gap-3 font-semibold"><span>{name(p.surah)}</span><span>{Math.min(99, Math.round(p.ayah / p.chapter.verses_count * 100))}%</span></Link><p className="mt-1 text-sm text-[var(--muted)]">{p.chapter.verses_count} {ar ? "آية" : "Ayahs"}{p.count > 0 && <span> · {ar ? "القراءة رقم" : "Reading"} {p.count + 1}</span>}</p><progress className="mt-3 w-full" max={100} value={Math.min(99,Math.round(p.ayah/p.chapter.verses_count*100))} aria-label={name(p.surah)} /><Link href={"/quran/" + p.surah + "?ayah=" + p.ayah} className="quran-btn-primary mt-3 inline-flex">{ar ? "متابعة من الآية" : "Resume Ayah"} {p.ayah}</Link></li>)}</ul></section>
 <section className="space-y-4"><h2 className="text-2xl font-semibold">{ar ? "قائمة السور المكتملة" : "Completed Surah List"}</h2>
 {!completed.length && <p className="text-sm text-[var(--muted)]">{ar ? "ستظهر السور هنا بعد تأكيد إتمام قراءتها." : "Completed surahs will appear here after you press Done."}</p>}
 {completed.map(s => <details key={s.surah} className="quran-card overflow-hidden border-s-4 border-s-[#315C4B]"><summary className="block list-none cursor-pointer p-6 [&::-webkit-details-marker]:hidden"><span className="flex flex-wrap items-start justify-between gap-3"><span className="text-xl font-semibold">{name(s.surah)}</span><span className="font-semibold text-[#315C4B]">{ar ? "مكتملة بنسبة ١٠٠٪" : "100% Completed"}</span></span><span className="block mt-1 text-sm text-[var(--muted)]">{chapters.find(c => c.id === s.surah)!.verses_count} {ar ? "آية" : "Ayahs"}</span><span className="block mt-3 font-medium text-[#66816F] underline underline-offset-4">{ar ? "إجمالي مرات الإتمام:" : "Total Completions:"} {s.completions}</span></summary>
 <div className="border-t px-6 pb-6 pt-4 space-y-4"><ol className="space-y-3">{completions.filter(c => c.surah === s.surah).sort((a,b) => b.reading_number-a.reading_number).map(c => <li key={c.reading_number}><p>{ar ? "الإتمام رقم" : "Completion"} {c.reading_number}</p><p className="text-sm text-[var(--muted)]">{c.completed_at ? <time dateTime={c.completed_at}>{mounted ? new Intl.DateTimeFormat(ar ? "ar" : "en", { dateStyle: "long", timeStyle: "short" }).format(new Date(c.completed_at)) : "…"}</time> : (ar ? "إتمام سابق — لم يُسجّل التاريخ والوقت" : "Earlier completion — date and time were not recorded")}</p></li>)}</ol><button type="button" className="quran-btn-secondary" disabled={pending !== null} onClick={() => void restart(s.surah)}>{ar ? "قراءة مجددًا" : "Read again"}</button></div></details>)}
 {message && <p role="alert">{message}</p>}</section></>;
}
