"use client";
import { useEffect, useState, type RefObject } from "react";
import { useI18n } from "./language-provider";
import { isReciterId, reciters, type ReciterId } from "@/lib/reciters";

import { PageRecitation } from "./page-recitation";

const storageKey = "my-quran-journey.reciter";
export function Recitation({ verseKey, audioRef, pageKeys, stopToken, onActiveAyah, playbackTarget, onPauseSave, saving, autoPlay, onRecitationEnabled, onVerseCompleted }: { onVerseCompleted?: (key: string) => void; autoPlay?: boolean; onRecitationEnabled?: (enabled: boolean) => void; verseKey: string; audioRef: RefObject<HTMLAudioElement | null>; pageKeys?: string[]; onPauseSave?: (key: string) => Promise<void>; saving?: boolean; playbackTarget?: HTMLDivElement | null; stopToken?: string; onActiveAyah?: (key: string | null) => void }) {
  const { language } = useI18n();
  const ar = language === "ar";
  const pageMode = pageKeys !== undefined;
  const [reciter, setReciter] = useState<ReciterId>("ar.alafasy");
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ key: string; reciter: string; audio: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    try { const saved = localStorage.getItem(storageKey); if (isReciterId(saved)) setReciter(saved); } catch { /* Storage may be disabled. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || pageMode) return;
    const abort = new AbortController();
    setResult(null); setError("");
    fetch(`/api/recitation/${verseKey}?reciter=${encodeURIComponent(reciter)}`, { signal: abort.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(response.status === 401 ? "sign_in" : "audio_unavailable");
        if (data.key !== verseKey || data.reciter !== reciter || typeof data.audio !== "string") throw new Error("audio_unavailable");
        if (!abort.signal.aborted) setResult(data);
      }).catch(reason => { if (!abort.signal.aborted) setError(reason.message === "sign_in" ? "sign_in" : "audio_unavailable"); });
    return () => abort.abort();
  }, [verseKey, reciter, retry, ready, pageMode]);
  const current = result?.key === verseKey && result?.reciter === reciter ? result : null;
  return <section aria-label={ar ? "التلاوة" : "Recitation"} dir={ar ? "rtl" : "ltr"} className="reader-recitation-settings space-y-3">
    <label className="block" htmlFor="reciter">{ar ? "القارئ" : "Reciter"}
      <select id="reciter" className="journey-input mt-1" value={reciter} disabled={!ready} onChange={event => {
        if (!isReciterId(event.target.value)) return;
        audioRef.current?.pause(); setResult(null); setError(""); setReciter(event.target.value);
        try { localStorage.setItem(storageKey, event.target.value); } catch { /* Selection still works for this session. */ }
      }}>{reciters.map(item => <option key={item.id} value={item.id}>{ar ? item.ar : item.en}</option>)}</select>
    </label>
    {pageKeys !== undefined && ready && <PageRecitation onVerseCompleted={onVerseCompleted} autoPlay={autoPlay} onRecitationEnabled={onRecitationEnabled} onPauseSave={onPauseSave} saving={saving} key={`${pageKeys.join(",")}:${reciter}:${stopToken}`} playbackTarget={playbackTarget} keys={pageKeys} reciter={reciter} audioRef={audioRef} onActiveAyah={onActiveAyah} />}
    {pageKeys === undefined && !current && !error && <p role="status">{ar ? "جارٍ تحميل التلاوة…" : "Loading recitation…"}</p>}
    {pageKeys === undefined && current && <audio key={`${verseKey}:${reciter}:${retry}`} ref={audioRef} controls onEnded={() => onVerseCompleted?.(verseKey)} preload="none" src={current.audio} className="w-full"
      aria-label={ar ? "تلاوة الآية الحالية" : "Recitation of the current ayah"} onError={() => setError("audio_unavailable")}>
      {ar ? "متصفحك لا يدعم تشغيل الصوت." : "Your browser does not support audio playback."}
    </audio>}
    {pageKeys === undefined && error && <div role="status" className="space-y-2"><p>{error === "sign_in" ? (ar ? "يرجى تسجيل الدخول مجددًا." : "Please sign in again.") :
      (ar ? "تعذّر تشغيل التلاوة. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة." : "Recitation could not be played. Check your connection and retry.")}</p>
      <button type="button" className="quran-btn-secondary" onClick={() => { audioRef.current?.pause(); setResult(null); setError(""); setRetry(value => value + 1); }}>{ar ? "إعادة تحميل التلاوة" : "Retry recitation"}</button></div>}

  </section>;
}
