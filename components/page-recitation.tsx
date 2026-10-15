"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { createPagePlayback, type PlaybackStatus } from "@/lib/page-playback";
import { useI18n } from "./language-provider";

export function PageRecitation({ keys, reciter, audioRef, onActiveAyah, playbackTarget, onPauseSave, saving, resumeKey, autoPlay, onRecitationEnabled, onVerseCompleted }: { onVerseCompleted?: (key: string) => void; autoPlay?: boolean; onRecitationEnabled?: (enabled: boolean) => void; resumeKey?: string; onPauseSave?: (key: string) => Promise<void>; saving?: boolean; playbackTarget?: HTMLDivElement | null; keys: string[]; reciter: string; audioRef: RefObject<HTMLAudioElement | null>; onActiveAyah?: (key: string | null) => void }) {
  const { language } = useI18n(), ar = language === "ar";
  const [status, setStatus] = useState<PlaybackStatus>("idle"), [index, setIndex] = useState(() => Math.max(0, keys.indexOf(resumeKey ?? "")));
  const controller = useRef<ReturnType<typeof createPagePlayback> | null>(null);
  const startAutomatically = useRef(autoPlay);
  const initialKey = useRef(resumeKey);
  const playingKey = useRef<string | null>(null);
  const signature = keys.join(",");
  useEffect(() => {
    const media = audioRef.current;
    if (!media) return;
    const localAudio = new Set<string>();
    const playback = createPagePlayback(signature ? signature.split(",") : [], media, async (key, signal) => {
      const response = await fetch(`/api/recitation/${key}?reciter=${encodeURIComponent(reciter)}`, { signal });
      if (!response.ok) throw new Error("Audio unavailable");
      const data = await response.json();
      if (data.key !== key || data.reciter !== reciter || typeof data.audio !== "string" || !data.audio.startsWith("https://")) throw new Error("Invalid audio");
      // Cache actual audio bytes, not just the API response, before the next transition.
      try {
        const audio = await fetch(data.audio, { signal });
        if (!audio.ok) throw new Error("Audio download unavailable");
        const blob = await audio.blob();
        if (signal.aborted) throw new Error("Cancelled");
        if (!blob.size) throw new Error("Empty audio");
        const url = URL.createObjectURL(blob);
        localAudio.add(url);
        return url;
      } catch (error) {
        if (signal.aborted) throw error;
        // Providers that disallow cross-origin downloads still support normal media playback.
        return data.audio;
      }
    }, (next, cursor) => { playingKey.current = signature.split(",")[cursor] ?? null; if (next !== "playing") onActiveAyah?.(null); if (next === "error") onRecitationEnabled?.(false); setStatus(next); setIndex(cursor); }, initialKey.current);
    controller.current = playback;
    if (startAutomatically.current && signature) void playback.play();
    return () => { playback.dispose(); media.removeAttribute("src"); media.load(); for (const url of localAudio) URL.revokeObjectURL(url); controller.current = null; onActiveAyah?.(null); };
  }, [signature, reciter, audioRef, onActiveAyah, onRecitationEnabled]);
  const active = status === "loading" || status === "playing";
  const controls = <div className="space-y-2 text-center" dir={ar ? "rtl" : "ltr"}>
    <button type="button" className="quran-btn-primary" aria-label={active ? (ar ? "إيقاف مؤقت والمتابعة لاحقًا" : "Pause & Continue Later") : status === "error" ? (ar ? "إعادة المحاولة" : "Retry recitation") : (ar ? "تشغيل التلاوة" : "Play recitation")} disabled={!keys.length || saving} onClick={() => {
      if (active) { onRecitationEnabled?.(false); const key = playingKey.current ?? keys[index]; controller.current?.pause(); if (key) void onPauseSave?.(key); }
      else { onRecitationEnabled?.(true); void controller.current?.play(); }
    }}>
      {active ? (ar ? "إيقاف مؤقت والمتابعة لاحقًا" : "Pause & Continue Later") : status === "error" ? (ar ? "إعادة المحاولة" : "Retry recitation") : <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="mx-auto"><path d="M7 4v16l14-8z" /></svg>}
    </button>
    <p role="status" className="text-sm">
      {status === "finished" ? (ar ? "اكتملت تلاوة الصفحة. يمكنك الانتقال إلى الصفحة التالية." : "Page recitation finished. You can now turn to the next page.")
        : status === "error" ? (ar ? "تعذّر تشغيل التلاوة. أعد المحاولة للمتابعة من الآية نفسها." : "Playback stopped. Retry to continue from the same ayah.")
        : status === "loading" ? (ar ? "جارٍ تحميل التلاوة…" : "Loading recitation…")
        : keys.length ? <>{ar ? "الآية " : "Ayah "}<bdi>{keys[index]}</bdi> · {ar ? "تلاوة آيات الصفحة بالتتابع" : "Continuous page recitation"}</> : (ar ? "جارٍ تجهيز الصفحة…" : "Preparing page…")}
    </p>
  </div>;
  return <>
    <audio ref={audioRef} preload="none" onPlaying={() => onActiveAyah?.(playingKey.current)} onPause={() => onActiveAyah?.(null)} onWaiting={() => onActiveAyah?.(null)} onEnded={() => { if (playingKey.current) onVerseCompleted?.(playingKey.current); controller.current?.ended(); }} onError={() => controller.current?.error()} />
    {playbackTarget ? createPortal(controls, playbackTarget) : playbackTarget === undefined ? controls : null}
  </>;
}
