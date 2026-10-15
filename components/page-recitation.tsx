"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPagePlayback, type PlaybackStatus } from "@/lib/page-playback";
import { useI18n } from "./language-provider";

export function PageRecitation({ keys, reciter, audioRef }: { keys: string[]; reciter: string; audioRef: RefObject<HTMLAudioElement | null> }) {
  const { language } = useI18n(), ar = language === "ar";
  const [status, setStatus] = useState<PlaybackStatus>("idle"), [index, setIndex] = useState(0);
  const controller = useRef<ReturnType<typeof createPagePlayback> | null>(null);
  const signature = keys.join(",");
  useEffect(() => {
    const media = audioRef.current;
    if (!media) return;
    const playback = createPagePlayback(signature ? signature.split(",") : [], media, async (key, signal) => {
      const response = await fetch(`/api/recitation/${key}?reciter=${encodeURIComponent(reciter)}`, { signal });
      if (!response.ok) throw new Error("Audio unavailable");
      const data = await response.json();
      if (data.key !== key || data.reciter !== reciter || typeof data.audio !== "string" || !data.audio.startsWith("https://")) throw new Error("Invalid audio");
      return data.audio;
    }, (next, cursor) => { setStatus(next); setIndex(cursor); });
    controller.current = playback;
    return () => { playback.dispose(); controller.current = null; };
  }, [signature, reciter, audioRef]);
  const active = status === "loading" || status === "playing";
  return <div className="space-y-2">
    <audio ref={audioRef} preload="none" onEnded={() => controller.current?.ended()} onError={() => controller.current?.error()} />
    <button type="button" className="quran-btn-primary" disabled={!keys.length} onClick={() => active ? controller.current?.pause() : void controller.current?.play()}>
      {active ? (ar ? "إيقاف مؤقت" : "Pause") : status === "paused" ? (ar ? "متابعة التلاوة" : "Resume recitation") : status === "error" ? (ar ? "إعادة المحاولة" : "Retry recitation") : (ar ? "تشغيل تلاوة الصفحة" : "Play page")}
    </button>
    <p role="status" className="text-sm">
      {status === "finished" ? (ar ? "اكتملت تلاوة الصفحة. يمكنك الانتقال إلى الصفحة التالية." : "Page recitation finished. You can now turn to the next page.")
        : status === "error" ? (ar ? "تعذّر تشغيل التلاوة. أعد المحاولة للمتابعة من الآية نفسها." : "Playback stopped. Retry to continue from the same ayah.")
        : status === "loading" ? (ar ? "جارٍ تحميل التلاوة…" : "Loading recitation…")
        : keys.length ? <>{ar ? "الآية " : "Ayah "}<bdi>{keys[index]}</bdi> · {ar ? "تلاوة آيات الصفحة بالتتابع" : "Continuous page recitation"}</> : (ar ? "جارٍ تجهيز الصفحة…" : "Preparing page…")}
    </p>
  </div>;
}
