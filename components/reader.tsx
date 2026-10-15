"use client";
import { useI18n } from "@/components/language-provider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { savePosition } from "@/app/actions/journey";
import type { VerseContent } from "@/lib/quran";

function PublishedText({text}:{text:string}) {
  // Render provider markup as inert text; never execute provider HTML.
  const [plain,setPlain]=useState(text);
  useEffect(()=>{const doc=new DOMParser().parseFromString(text,"text/html");setPlain(doc.body.textContent||"");},[text]);
  return <span className="whitespace-pre-wrap">{plain}</span>;
}
export function Reader({surah,initialAyah,verses,initialLanguage,databaseWarning}:{surah:number;initialAyah:number;verses:{key:string;arabic:string}[];initialLanguage:string;databaseWarning:boolean}) {
const { t, language: uiLanguage } = useI18n();

  const [ayah,setAyah]=useState(initialAyah),[language,setLanguage]=useState(initialLanguage);
 const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState(""),[content,setContent]=useState<VerseContent|null>(null);
  const [loading,setLoading]=useState(true),[retry,setRetry]=useState(0),[dirty,setDirty]=useState(false);
  const audioRef=useRef<HTMLAudioElement>(null);
  const verse=verses[ayah-1], percent=Math.round(ayah/verses.length*100);
  useEffect(()=>{
    const abort=new AbortController();
    setContent(null);setLoading(true);
    fetch(`/api/quran/${verse.key}?language=${language}`,{signal:abort.signal}).then(async response=>{
      const data=await response.json();if(!response.ok) throw new Error(data.error||t("Could not load translation."));
      if(data.key!==verse.key) throw new Error(t("Verse response mismatch"));return data;
    }).then(setContent).catch(error=>{if(!abort.signal.aborted)setContent({key:verse.key,arabic:verse.arabic,notices:[error.message]});}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});
    return ()=>abort.abort();
  },[verse.key,verse.arabic,language,retry,t]);
  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue="";}};
    window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);
  },[dirty]);
  async function navigate(next: number) {
    const scrollPosition = window.scrollY;
  audioRef.current?.pause();

  setAyah(next);
  setDirty(false);
  setStatus("Saving progress...");

  window.history.replaceState(null, "", `/quran/${surah}?ayah=${next}`);
requestAnimationFrame(() => window.scrollTo({ top: scrollPosition, behavior: "instant" }));
  try {
    const result = await savePosition(`${surah}:${next}`);

    if (result.error) {
      setStatus("Progress could not be saved. Please try again.");
      setDirty(true);
    } else {
      setStatus(`Progress automatically saved at Ayah ${next}.`);
    }
  } catch {
    setStatus("Progress could not be saved. Please try again.");
    setDirty(true);
  }
}

async function save() {
  audioRef.current?.pause();
  setBusy(true);

  try {
    const result = await savePosition(verse.key);

    if (result.error) {
      setStatus(result.error);
      setDirty(true);
    } else {
      setDirty(false);
      setStatus(`Paused at Ayah ${ayah}. You can continue from here later.`);
    }
  } catch {
    setStatus("Pause position could not be saved. Please try again.");
  } finally {
    setBusy(false);
  }
}async function done() {
  audioRef.current?.pause();
  setBusy(true);
  setStatus("Completing Surah...");

  try {
    const result = await savePosition(`${surah}:${verses.length}`);

    if (result.error) {
      setStatus(result.error);
      setDirty(true);
      return;
    }

    setDirty(false);
    window.location.href = "/quran";
  } catch {
    setStatus("Completion could not be saved. Please try again.");
    setDirty(true);
  } finally {
    setBusy(false);
  }
}

  return <div className="mx-auto max-w-3xl space-y-5">
    {databaseWarning&&<p role="alert" className="journey-warning">{t("Database setup is needed before your progress can be saved.")}</p>}
    <section className="quran-card p-5 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-[var(--muted)]">{t("Current position ·")}{" "}<bdi dir="ltr">{verse.key}</bdi></p><h2 className="text-2xl font-semibold">{t("Ayah")}{" "}{ayah} {t("of")}{" "}{verses.length}</h2></div><label>{t("Display")}<select className="journey-input mt-1" value={language} onChange={e=>setLanguage(e.target.value)}><option value="arabic">{t("Arabic")}</option><option value="english">{t("Arabic + English")}</option><option value="tagalog">{t("Arabic + Tagalog")}</option></select></label></div>
      <div><progress aria-label={t("Position within this surah")} max={verses.length} value={ayah} className="w-full"/><p className="text-sm text-[var(--muted)]">{percent}{t("% through this surah by position. This does not count every earlier ayah as read.")}</p></div>
      <p lang="ar" dir="rtl" translate="no" className="arabic-text text-3xl sm:text-4xl py-5 leading-loose">{verse.arabic}</p>
      <p className="text-xs">{t("Arabic:")}{" "}<a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">{t("Tanzil Project")}</a> {t("· Uthmani, Ḥafṣ ʿan ʿĀṣim · Version 1.1. Text preserved unchanged.")}</p>
      {loading&&<p role="status">{t("Loading translation and recitation…")}</p>}
      {language==="english"&&content?.english&&<div lang="en" dir="ltr" translate="no" className="space-y-3"><p className="text-lg"><PublishedText text={content.english}/></p><p className="text-xs">{t("Translation of the meanings:")}{" "}{content.englishSource} · <a className="underline" href="https://quran.com">{t("Quran Foundation")}</a></p></div>}
      {language==="tagalog"&&content?.tagalog&&<div lang="tl" dir="ltr" translate="no" className="space-y-3"><p className="text-lg whitespace-pre-wrap">{content.tagalog}</p>{content.tagalogFootnotes&&<div className="text-sm border-t pt-3"><h3 className="font-semibold">Mga talababa / Footnotes</h3><p className="whitespace-pre-wrap">{content.tagalogFootnotes}</p></div>}<p className="text-xs">Salin sa Wikang Filipino (Tagalog) ng Sentro ng Rowad sa Pagsasalin · <a className="underline" href={`https://quranenc.com/tl/browse/tagalog_rwwad/${surah}`}>QuranEnc</a> · Version {content.tagalogVersion}. Published with Rabwah Da‘wah Association, the Association for Serving Islamic Content in Languages, and IslamHouse. <a className="underline" href="https://quranenc.com/en/home/api">Source and terms</a>.</p></div>}
      {!loading&&language!=="arabic"&&!(language==="english"?content?.english:content?.tagalog)&&<p>{t("Selected translation is unavailable. The Arabic text remains available.")}</p>}
      {content?.audio&&<div><p className="text-sm mb-2">{t("Recitation:")}{" "}{content.reciter} {t("· Quran Foundation")}</p><audio key={verse.key} ref={audioRef} controls preload="none" src={content.audio} className="w-full" onError={()=>setStatus("Audio could not be played. Check your connection and retry.")}>{t("Your browser does not support audio playback.")}</audio></div>}
      {content?.notices.map((notice,i)=><p key={i} className="journey-warning" role="status">{t(notice)}</p>)}
      {!!content?.notices.length&&<button className="quran-btn-secondary" onClick={()=>setRetry(r=>r+1)}>{t("Retry translation / audio")}</button>}
     <div className="flex flex-wrap items-center justify-between gap-4">
  <button
   className="quran-btn-secondary flex h-16 w-16 items-center justify-center text-3xl font-bold text-[#17372C] border-2 border-[#315C4B]"
    disabled={ayah === 1 || busy}
    onClick={() => navigate(ayah - 1)}
    aria-label={t("Previous ayah")}
  >
    {uiLanguage === "ar" ? "→" : "←"}
  </button>

  <label className="flex items-center gap-3">
    <span className="font-medium">{t("Ayah")}</span>
    <select
      aria-label={t("Go to ayah")}
      className="journey-input"
      disabled={busy}
      value={ayah}
      onChange={(e) => navigate(Number(e.target.value))}
    >
      {verses.map((v, i) => (
        <option key={v.key} value={i + 1}>
          {i + 1}
        </option>
      ))}
    </select>
  </label>

  <button
   className="quran-btn-secondary flex h-16 w-16 items-center justify-center text-3xl font-bold text-[#17372C] border-2 border-[#315C4B]"
    disabled={ayah === verses.length || busy}
    onClick={() => navigate(ayah + 1)}
    aria-label={t("Next ayah")}
  >
    {uiLanguage === "ar" ? "←" : "→"}
  </button>
</div>
<div className="flex items-center justify-between gap-4">
     {ayah === verses.length ? (
  <button
    type="button"
    className="quran-btn-primary"
    disabled={busy}
    onClick={done}
  >
    {busy ? t("Please wait...") : t("Done")}
  </button>
) : (
  <button
    type="button"
    className="quran-btn-primary"
    disabled={busy}
    onClick={save}
  >
    {busy ? t("Please wait...") : t("Pause & Continue Later")}
  </button>
)}

  <Link
    href={`/reflections?verse=${verse.key}`}
    className="quran-btn-secondary"
  >
    {t("Add Reflection")}{" "}</Link>
</div>
      <p aria-live="polite" className="text-sm min-h-6">{t(status)||t("Save your current position before leaving the reader.")}</p>
    </section>
    <div className="flex justify-between gap-4">{surah>1?<Link className="underline" href={`/quran/${surah-1}`}>{t("Previous surah")}</Link>:<span/>}{surah<114&&<Link className="underline" href={`/quran/${surah+1}`}>{t("Next surah")}</Link>}</div>
</div>
}


