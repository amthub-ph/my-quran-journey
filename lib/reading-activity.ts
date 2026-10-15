import { parseVerseKey } from "./quran";
export function readingDay(timeZone: string, now = new Date()) {
  if (typeof timeZone !== "string" || timeZone.length > 100) throw new Error("Invalid timezone");
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (name: string) => parts.find(item => item.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function completedKeys(surah: number, start: number, end: number) {
  if (![surah, start, end].every(Number.isInteger) || end < start) throw new Error("Invalid range");
  parseVerseKey(`${surah}:${start}`); parseVerseKey(`${surah}:${end}`);
  return Array.from({ length: end - start + 1 }, (_, index) => `${surah}:${start + index}`);
}
export function validDailyGoal(value: number) { return Number.isInteger(value) && value >= 1 && value <= 6236; }
