import Link from "next/link";
import { parseVerseKey, positionPercent } from "@/lib/quran";
export function SavedPosition({verseKey,error}:{verseKey?:string;error?:boolean}) {
  let position;try{if(verseKey)position=parseVerseKey(verseKey);}catch{/* Treat invalid legacy state as unavailable. */}
  if(error)return <div className="quran-card p-6"><p role="alert">Saved progress could not be loaded. Check the database setup and connection.</p><Link className="underline" href="/quran">Browse surahs</Link></div>;
  if(!position)return <div className="quran-card p-6"><h2 className="text-2xl font-semibold">Begin your journey</h2><p className="my-4">No saved position yet. Use Pause & Save in the reader.</p><Link className="quran-btn-primary inline-block" href="/quran">Choose a surah</Link></div>;
  return <div className="quran-card p-6"><p className="text-sm text-[var(--muted)]">Continue reading</p><h2 className="text-2xl font-semibold mt-2">{position.chapter.name_simple}</h2><p className="arabic-text text-2xl" lang="ar" translate="no">{position.chapter.name_arabic}</p><p className="mt-4">Ayah {position.ayah} / {position.chapter.verses_count} · {positionPercent(verseKey!)}%</p><progress className="w-full my-3" aria-label="Saved position within surah" max={position.chapter.verses_count} value={position.ayah}/><p className="text-sm mb-5">Progress reflects your saved position within this surah.</p><Link className="quran-btn-primary inline-block" href={`/quran/${position.surah}?ayah=${position.ayah}`}>Resume from Ayah {position.ayah}</Link></div>;
}
