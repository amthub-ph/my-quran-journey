"use client";
import { useEffect, useState } from "react";
import { useI18n } from "./language-provider";
import { getDailyReading, updateDailyGoal } from "@/app/actions/reading-activity";
export function DailyGoal({ initialGoal }: { initialGoal: number }) {
  const { language } = useI18n(), ar = language === "ar";
  const [goal, setGoal] = useState(initialGoal), [draft, setDraft] = useState(String(initialGoal));
  const [editing, setEditing] = useState(false), [saving, setSaving] = useState(false);
  const [count, setCount] = useState<number | null>(null), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  const [readingDate, setReadingDate] = useState("");
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await getDailyReading(Intl.DateTimeFormat().resolvedOptions().timeZone);
        if (cancelled) return;
        if (result.error) { setCount(null); setError(result.error); }
        else { setCount(result.count ?? 0); setReadingDate(result.day ?? ""); setError(""); }
      } catch { if (!cancelled) { setCount(null); setError("activity_unavailable"); } }
    };
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60000);
    const visible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", visible);
    return () => { cancelled = true; clearInterval(timer); document.removeEventListener("visibilitychange", visible); window.removeEventListener("focus", visible); };
  }, [retry]);
  useEffect(() => { if (editing) document.getElementById("daily-goal")?.focus(); }, [editing]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setSaveError("");
    try {
      const result = await updateDailyGoal(Number(draft));
      if (result.error) setSaveError(result.error);
      else { setGoal(Number(draft)); setEditing(false); setRetry(value => value + 1); }
    } catch { setSaveError("save_failed"); }
    finally { setSaving(false); }
  }
  const completed = count !== null && count >= goal, percent = count === null ? 0 : Math.min(100, Math.floor(count / goal * 100));
  return <section className="rounded-[24px] bg-[#F3EEE2] p-6 space-y-5" aria-label={ar ? "الهدف اليومي" : "Daily Goal"}>
    <h2 className="text-xl font-semibold">{ar ? "الهدف اليومي" : "Daily Goal"}</h2>
    <div className="flex items-center gap-5">
      <button type="button" onClick={() => { setDraft(String(goal)); setEditing(true); }} aria-label={ar ? "تعديل الهدف اليومي" : "Edit daily goal"} className="h-24 w-24 shrink-0 rounded-full border-[7px] border-[#315C4B] bg-white text-[#315C4B]">
        <strong className="block text-2xl">{goal.toLocaleString(ar ? "ar" : "en")}</strong><span className="text-xs">{ar ? "آية ✎" : "AYAT ✎"}</span>
      </button>
      <div className="flex-1"><p className="text-sm">{count === null ? "—" : count.toLocaleString(ar ? "ar" : "en")} / {goal.toLocaleString(ar ? "ar" : "en")} {ar ? "آية اليوم" : "ayat today"}</p><progress className="w-full mt-3" value={count === null ? 0 : Math.min(count, goal)} max={goal} aria-label={ar ? "تقدم الهدف اليومي" : "Daily goal progress"} /><p className="text-sm mt-1">{count === null ? "—" : `${percent}%`}</p></div>
    </div>
    {editing && <form onSubmit={event => void save(event)} className="space-y-3"><label className="block" htmlFor="daily-goal">{ar ? "عدد الآيات يوميًا" : "Ayahs per day"}<input id="daily-goal" type="number" min="1" max="6236" step="1" required className="journey-input mt-1" value={draft} onChange={event => setDraft(event.target.value)} disabled={saving} /></label><div className="flex gap-2"><button className="quran-btn-primary" disabled={saving}>{ar ? "حفظ" : "Save"}</button><button type="button" className="quran-btn-secondary" disabled={saving} onClick={() => setEditing(false)}>{ar ? "إلغاء" : "Cancel"}</button></div>{saveError && <p role="alert">{saveError === "invalid_goal" ? (ar ? "أدخل عددًا صحيحًا بين ١ و٦٢٣٦." : "Enter a whole number from 1 to 6236.") : (ar ? "تعذّر حفظ الهدف. أعد المحاولة." : "Your goal could not be saved. Please retry.")}</p>}</form>}
    {completed && <div role="status"><p className="text-xl font-semibold text-[#315C4B]">{ar ? "ما شاء الله 🍀" : "Ma Sha Allah 🍀"}</p><p className="font-semibold">{ar ? "اكتمل هدف اليوم" : "Today’s Goal Completed"}</p>{readingDate && <p className="mt-1 text-sm text-[#63846B]">{ar ? "تاريخ إكمال الهدف: " : "Goal completed: "}<time dateTime={readingDate}>{new Intl.DateTimeFormat(ar ? "ar" : "en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${readingDate}T12:00:00Z`))}</time></p>}<p className="mt-2 text-sm text-[#63846B]">{ar ? "واصل — سورة واحدة في كل مرة" : "Keep Going - One Surah at a time"}</p><button type="button" className="mt-3 text-sm font-semibold text-[#315C4B] underline underline-offset-4" onClick={() => { setDraft(String(goal)); setSaveError(""); setEditing(true); }}>{ar ? "تعديل الهدف اليومي" : "Reset Daily Goal"}</button></div>}
    {error && <div role="status" className="text-sm"><p>{ar ? "تعذّر تحميل نشاط اليوم. يرجى التحقق من إعداد سجل القراءة والاتصال." : "Today’s activity could not be loaded. Check the reading-log setup and connection."}</p><button className="underline mt-2" onClick={() => setRetry(value => value + 1)}>{ar ? "إعادة المحاولة" : "Retry"}</button></div>}
  </section>;
}
