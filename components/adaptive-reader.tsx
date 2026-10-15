"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { recordCompletedAyahs } from "@/app/actions/reading-activity";
import { saveReaderPosition as savePosition } from "@/lib/save-reader-position";
import { useI18n } from "./language-provider";
import { Recitation } from "./recitation";
import { BookPage } from "./book-page";
import { isReadingLanguage, readPreferences, type ChapterTranslation, type ReadingPreferences, type ReadingPage } from "@/lib/reading-layout";

const preferencesKey = "my-quran-journey.reading";
function publishedPlainText(text: string) {
  const doc = new DOMParser().parseFromString(text, "text/html");
  doc.querySelectorAll("script,style,iframe,object").forEach(node => node.remove());
  return doc.body.textContent || "";
}
export function Reader({ surah, initialAyah, verses, initialLanguage, databaseWarning }: {
  surah: number; initialAyah: number; verses: { key: string; arabic: string }[]; initialLanguage: string; databaseWarning: boolean;
}) {
  const { t, language: uiLanguage } = useI18n();
  const [ayah, setAyah] = useState(initialAyah), [preferences, setPreferences] = useState(() => readPreferences(null, initialLanguage));
  const [preferencesReady, setPreferencesReady] = useState(false), [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState(""), [translation, setTranslation] = useState<ChapterTranslation | null>(null);
  const [translationError, setTranslationError] = useState(""), [retry, setRetry] = useState(0), [lastPage, setLastPage] = useState(false);
  const [visiblePage, setVisiblePage] = useState<ReadingPage | null>(null);
  const [activeAyah, setActiveAyah] = useState<string | null>(null);
  const [playbackTarget, setPlaybackTarget] = useState<HTMLDivElement | null>(null);
  const [pendingReading, setPendingReading] = useState<{ surah: number; start: number; end: number }[]>([]);
  const recordReading = useCallback(async (chapter: number, start: number, end: number) => {
    const same = (item: { surah: number; start: number; end: number }) => item.surah === chapter && item.start === start && item.end === end;
    try {
      const result = await recordCompletedAyahs(chapter, start, end, Intl.DateTimeFormat().resolvedOptions().timeZone);
      if (result.error) throw new Error(result.error);
      setPendingReading(items => items.filter(item => !same(item)));
    } catch { setPendingReading(items => items.some(same) ? items : [...items, { surah: chapter, start, end }]); }
  }, []);
  const verseCompleted = useCallback((key: string) => {
    const [chapter, number] = key.split(":").map(Number);
    void recordReading(chapter, number, number);
  }, [recordReading]);
  const [fullScreen, setFullScreen] = useState(false);
  const readerRoot = useRef<HTMLDivElement>(null);
  const [recitationEnabled, setRecitationEnabled] = useState(false);
  const [audioStop, setAudioStop] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null), saveLock = useRef(false);
  const cache = useRef(new Map<string, ChapterTranslation>());
  const { language, view, scale } = preferences;
  const current = verses[ayah - 1], percent = Math.round(ayah / verses.length * 100);
  const fontSize = (language === "arabic" ? 32 : 22) * scale / 100;
  const currentTranslation = translation?.surah === surah && translation.language === language ? translation : null;
  const readingVerses = useMemo(() => language === "arabic" ? verses.map(verse => ({ key: verse.key, text: verse.arabic, footnotes: undefined })) : currentTranslation?.verses || [], [language, verses, currentTranslation]);
  const ready = preferencesReady && readingVerses.length === verses.length;
  const selectedText = readingVerses[ayah - 1];
  const textLanguage = language === "arabic" ? "ar" : language === "english" ? "en" : "tl";
  useEffect(() => {
    try { setPreferences(readPreferences(localStorage.getItem(preferencesKey), initialLanguage)); } catch { /* Browser storage is optional. */ }
    setPreferencesReady(true);
  }, [initialLanguage]);
  useEffect(() => {
    if (!fullScreen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    readerRoot.current?.querySelector<HTMLButtonElement>(".reader-fullscreen-toggle")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setFullScreen(false); }
      if (event.key !== "Tab") return;
      const controls = Array.from(readerRoot.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], select:not(:disabled), input:not(:disabled), [tabindex="0"]') ?? []).filter(node => node.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keyboard); previousFocus?.focus(); };
  }, [fullScreen]);
  function changePreferences(next: ReadingPreferences) {
    setRecitationEnabled(false);
    audioRef.current?.pause(); setAudioStop(value => value + 1); setLastPage(false); setPreferences(next);
    try { localStorage.setItem(preferencesKey, JSON.stringify(next)); } catch { /* Keep the current session usable. */ }
  }
  useEffect(() => {
    if (!preferencesReady || language === "arabic") return;
    const key = `${surah}:${language}`, cached = cache.current.get(key);
    setTranslationError("");
    if (cached) { setTranslation(cached); return; }
    const abort = new AbortController();
    setTranslation(null);
    fetch(`/api/quran/chapter/${surah}?language=${language}`, { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error(response.status === 401 ? "sign_in" : "translation_unavailable");
      const data = await response.json() as ChapterTranslation;
      if (data.surah !== surah || data.language !== language || !Array.isArray(data.verses) || data.verses.length !== verses.length ||
        data.verses.some((verse, index) => verse.key !== `${surah}:${index + 1}` || typeof verse.text !== "string" || !verse.text.trim())) throw new Error("translation_unavailable");
      data.verses = data.verses.map(verse => ({ ...verse, text: publishedPlainText(verse.text), footnotes: verse.footnotes ? publishedPlainText(verse.footnotes) : undefined }));
      if (data.verses.some(verse => !verse.text.trim())) throw new Error("translation_unavailable");
      if (!abort.signal.aborted) { cache.current.set(key, data); setTranslation(data); }
    }).catch(error => { if (!abort.signal.aborted) setTranslationError(error.message === "sign_in" ? "sign_in" : "translation_unavailable"); });
    return () => abort.abort();
  }, [preferencesReady, language, surah, verses.length, retry]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function navigate(next: number, completed = false) {
    if (saveLock.current || next < 1 || next > verses.length || next === ayah) return;
    audioRef.current?.pause(); setAudioStop(value => value + 1); saveLock.current = true; setBusy(true); setDirty(true); setAyah(next); setStatus("Saving progress...");
    window.history.replaceState(null, "", `/quran/${surah}?ayah=${next}`);
    try {
      if (completed && next > ayah) {
        if (view === "book" && visiblePage && next === visiblePage.end + 1) await recordReading(surah, visiblePage.start, visiblePage.end);
        else if (view === "ayah" && next === ayah + 1) await recordReading(surah, ayah, ayah);
      }
      const result = await savePosition(`${surah}:${next}`);
      if (result.error) setStatus("Progress could not be saved. Please try again.");
      else { setDirty(false); setStatus(`Progress automatically saved at Ayah ${next}.`); }
    } catch { setStatus("Progress could not be saved. Please try again."); }
    finally { saveLock.current = false; setBusy(false); }
  }
  async function savePaused(key: string) {
    setRecitationEnabled(false);
    if (saveLock.current || !verses.some(verse => verse.key === key)) return;
    const next = Number(key.split(":")[1]);
    saveLock.current = true; setBusy(true); setDirty(true); setAyah(next); setStatus("Saving progress...");
    window.history.replaceState(null, "", `/quran/${surah}?ayah=${next}`);
    try {
      const result = await savePosition(key);
      if (result.error) setStatus("Progress could not be saved. Please try again.");
      else { setDirty(false); setStatus(`Paused at Ayah ${next}. You can continue from here later.`); }
    } catch { setStatus("Progress could not be saved. Please try again."); }
    finally { saveLock.current = false; setBusy(false); }
  }
  async function save(complete = false) {
    if (saveLock.current) return;
    audioRef.current?.pause(); setAudioStop(value => value + 1); saveLock.current = true; setBusy(true); setDirty(true);
    if (complete) setStatus("Completing Surah...");
    try {
      if (complete) await recordReading(surah, view === "book" && visiblePage ? visiblePage.start : ayah, verses.length);
      const result = await savePosition(complete ? `${surah}:${verses.length}` : current.key);
      if (result.error) setStatus(result.error);
      else {
        setDirty(false);
        if (complete) window.location.href = "/quran";
        else setStatus(`Paused at Ayah ${ayah}. You can continue from here later.`);
      }
    } catch { setStatus(complete ? "Completion could not be saved. Please try again." : "Pause position could not be saved. Please try again."); }
    finally { saveLock.current = false; setBusy(false); }
  }
  return <div ref={readerRoot} className={`mx-auto max-w-3xl space-y-5 ${fullScreen ? "reader-fullscreen" : ""}`} role={fullScreen ? "dialog" : undefined} aria-modal={fullScreen || undefined} aria-label={fullScreen ? (uiLanguage === "ar" ? "قراءة بملء الشاشة" : "Fullscreen reading") : undefined}>
    <div className="reader-fullscreen-heading flex justify-end"><button type="button" className="quran-btn-secondary reader-fullscreen-toggle" disabled={busy} onClick={() => {
      if (!fullScreen && view !== "book") changePreferences({ ...preferences, view: "book" });
      setFullScreen(value => !value);
    }}>{fullScreen ? (uiLanguage === "ar" ? "الخروج من ملء الشاشة" : "Exit fullscreen") : (uiLanguage === "ar" ? "قراءة بملء الشاشة" : "Fullscreen reading")}</button></div>
    {databaseWarning && <p role="alert" className="journey-warning">{t("Database setup is needed before your progress can be saved.")}</p>}
    <section className="quran-card p-4 sm:p-8 space-y-6">
      <div className="reader-toolbar">
        <label htmlFor="reading-view"><span className="reader-control-label">{t("Reading view")}</span><select id="reading-view" className="journey-input mt-1" value={view} disabled={!preferencesReady || busy} onChange={event => changePreferences({ ...preferences, view: event.target.value === "book" ? "book" : "ayah" })}>
          <option value="ayah">{t("One ayah")}</option><option value="book">{t("Book view")}</option>
        </select></label>
        <label htmlFor="reading-language"><span className="reader-control-label">{t("Reading language")}</span><select id="reading-language" className="journey-input mt-1" value={language} disabled={!preferencesReady || busy} onChange={event => { if (isReadingLanguage(event.target.value)) changePreferences({ ...preferences, language: event.target.value }); }}>
          <option value="arabic">{t("Arabic")}</option><option value="english">{t("English")}</option><option value="tagalog">{t("Tagalog")}</option>
        </select></label>
        <label htmlFor="reading-size"><span className="reader-control-label">{t("Text size")}</span> <output htmlFor="reading-size"><bdi>{scale}%</bdi></output>
          <input id="reading-size" className="reader-font-slider" type="range" min="80" max="160" step="10" value={scale} disabled={!preferencesReady || busy} onChange={event => changePreferences({ ...preferences, scale: Number(event.target.value) })} />
        </label>
      </div>
      <div>
        <div className="flex flex-wrap justify-between gap-3 mb-2"><p>{uiLanguage === "ar" ? "تقدم القراءة ·" : "Reading progress ·"} <bdi dir="ltr">{current.key}</bdi></p><p><bdi>{percent}%</bdi></p></div>
        <progress aria-label={t("Position within this surah")} max={verses.length} value={ayah} className="w-full" />
      </div>
      {language === "arabic" && <Recitation onVerseCompleted={verseCompleted} autoPlay={recitationEnabled} onRecitationEnabled={setRecitationEnabled} onPauseSave={savePaused} saving={busy} playbackTarget={view === "book" ? playbackTarget : undefined} onActiveAyah={setActiveAyah} verseKey={current.key} audioRef={audioRef} pageKeys={view === "book" ? (ready && visiblePage && ayah >= visiblePage.start && ayah <= visiblePage.end ? verses.slice(visiblePage.start - 1, visiblePage.end).map(verse => verse.key) : []) : undefined} stopToken={`${audioStop}:${language}:${scale}:${view}`} />}
      {!ready && !translationError && <p role="status">{t("Loading reading text…")}</p>}
      {!ready && translationError && <div role="status" className="journey-warning space-y-3">
        <p>{translationError === "sign_in" ? t("Please sign in again.") : t("This translation could not be loaded. Retry or choose another reading language.")}</p>
        <button type="button" className="quran-btn-secondary" onClick={() => { setTranslationError(""); setRetry(value => value + 1); }}>{t("Retry translation")}</button>
      </div>}
      {ready && view === "book" && <BookPage verses={readingVerses} language={language} fontSize={fontSize} ayah={ayah} busy={busy} onNavigate={(next, completed) => void navigate(next, completed)} onLastPage={setLastPage} onPageChange={setVisiblePage} activeAyah={activeAyah} onPlaybackTarget={setPlaybackTarget} />}
      {ready && view === "ayah" && <p className={`reader-single-text ${language === "arabic" ? "arabic-text" : ""}`} style={{ fontSize }} lang={textLanguage} dir={language === "arabic" ? "rtl" : "ltr"} translate="no">{selectedText?.text}</p>}
      <div className="reader-secondary-actions flex flex-wrap items-center justify-between gap-3">
        {view === "ayah" && <button type="button" className="quran-btn-secondary" disabled={ayah === 1 || busy} onClick={() => void navigate(ayah - 1)}>{t("Previous ayah")}</button>}
        <label className="flex items-center gap-3" htmlFor="selected-ayah">{t("Selected ayah")}<select id="selected-ayah" aria-label={t("Go to ayah")} className="journey-input !w-auto" disabled={busy} value={ayah} onChange={event => void navigate(Number(event.target.value))}>
          {verses.map((verse, index) => <option key={verse.key} value={index + 1}>{(index + 1).toLocaleString(uiLanguage === "ar" ? "ar" : "en")}</option>)}
        </select></label>
        <Link href={`/reflections?verse=${current.key}`} className="quran-btn-secondary">{t("Add Reflection")}</Link>
        {view === "ayah" && <button type="button" className="quran-btn-secondary" disabled={ayah === verses.length || busy} onClick={() => void navigate(ayah + 1, true)}>{t("Next ayah")}</button>}
      </div>
      {(view === "ayah" || (ready && lastPage)) && <div className="reader-completion-actions flex flex-wrap items-center justify-between gap-3">
        {view === "ayah" && <button type="button" className="quran-btn-primary" disabled={busy} onClick={() => void save()}>{busy ? t("Please wait...") : t("Pause & Continue Later")}</button>}
        {ready && (view === "book" ? lastPage : ayah === verses.length) && <button type="button" className="quran-btn-primary" disabled={busy} onClick={() => void save(true)}>{t("Done")}</button>}
      </div>}
      {dirty && !busy && <button type="button" className="quran-btn-secondary" onClick={() => void savePaused(current.key)}>{uiLanguage === "ar" ? "إعادة محاولة حفظ التقدم" : "Retry saving progress"}</button>}
      {pendingReading.length > 0 && <div role="status" className="journey-warning"><p>{uiLanguage === "ar" ? "تعذّر تسجيل بعض الآيات في هدف اليوم. يُحفظ موضع القراءة بشكل مستقل." : "Some ayahs could not be added to today’s goal. Your saved position is handled separately."}</p><button type="button" className="underline" onClick={() => { void (async () => { for (const item of pendingReading) await recordReading(item.surah, item.start, item.end); })(); }}>{uiLanguage === "ar" ? "إعادة تسجيل نشاط القراءة" : "Retry reading activity"}</button></div>}
      <p aria-live="polite" className="text-sm empty:hidden">{status ? t(status) : ""}</p>
      {language === "arabic" ? <p className="reader-source-note text-xs">{t("Arabic:")} <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">{t("Tanzil Project")}</a> {t("· Uthmani, Ḥafṣ ʿan ʿĀṣim · Version 1.1. Text preserved unchanged.")}</p>
        : currentTranslation && <div className="reader-source-note space-y-2 text-xs">
          <p>{t("Translation of the meanings:")} <span lang={textLanguage} dir="ltr">{currentTranslation.source.name}</span> · <a className="underline" href={currentTranslation.source.url} target="_blank" rel="noreferrer">{currentTranslation.source.provider}</a>{currentTranslation.source.version && <> · {t("Version")} <bdi>{currentTranslation.source.version}</bdi></>}</p>
          {currentTranslation.fallback && <p>{t("The configured English translation is unavailable for this surah. This chapter uses the credited QuranEnc translation.")}</p>}
          {currentTranslation.source.description && <details><summary>{t("About this translation")}</summary><p dir="ltr" lang={textLanguage}>{currentTranslation.source.description}</p></details>}
          {selectedText?.footnotes && <details key={current.key}><summary>{t("Notes for selected ayah")}</summary><p lang={textLanguage} dir="ltr" className="whitespace-pre-wrap text-base">{selectedText.footnotes}</p></details>}
        </div>}
    </section>
    <div className="reader-surah-navigation flex justify-between gap-4">{surah > 1 ? <Link className="underline" href={`/quran/${surah - 1}`}>{t("Previous surah")}</Link> : <span />}{surah < 114 && <Link className="underline" href={`/quran/${surah + 1}`}>{t("Next surah")}</Link>}</div>
  </div>;
}
