export type ReadingLanguage = "arabic" | "english" | "tagalog";
export type ReadingView = "ayah" | "book";
export type ReadingPreferences = { language: ReadingLanguage; view: ReadingView; scale: number };
export type ReadingPage = { start: number; end: number };
export type ReadingVerse = { key: string; text: string; footnotes?: string };
export type ChapterTranslation = {
  surah: number; language: "english" | "tagalog"; verses: ReadingVerse[]; fallback: boolean;
  source: { name: string; description?: string; url: string; provider: "Quran Foundation" | "QuranEnc"; version?: string };
};
export function isReadingLanguage(value: unknown): value is ReadingLanguage {
  return value === "arabic" || value === "english" || value === "tagalog";
}
export function readPreferences(raw: string | null, initialLanguage: string): ReadingPreferences {
  const defaults: ReadingPreferences = { language: isReadingLanguage(initialLanguage) ? initialLanguage : "arabic", view: "ayah", scale: 100 };
  try {
    const value = JSON.parse(raw || "null");
    if (!value || typeof value !== "object") return defaults;
    return {
      language: isReadingLanguage(value.language) ? value.language : defaults.language,
      view: value.view === "book" ? "book" : "ayah",
      scale: Number.isInteger(value.scale) && value.scale >= 80 && value.scale <= 160 && value.scale % 10 === 0 ? value.scale : 100,
    };
  } catch { return defaults; }
}
// One-based inclusive ranges; never split, skip, or duplicate an ayah.
export function paginateAyahs(heights: readonly number[], pageHeight: number, gap = 14): ReadingPage[] {
  if (!Number.isFinite(pageHeight) || pageHeight <= 0 || !Number.isFinite(gap) || gap < 0 || heights.some(h => !Number.isFinite(h) || h <= 0)) throw new Error("Invalid page measurements");
  const pages: ReadingPage[] = [];
  let start = 1, used = 0;
  heights.forEach((height, index) => {
    const extra = index + 1 > start ? gap : 0;
    if (index + 1 > start && used + extra + height > pageHeight) {
      pages.push({ start, end: index }); start = index + 1; used = 0;
    }
    used += (index + 1 > start ? gap : 0) + height;
  });
  if (heights.length) pages.push({ start, end: heights.length });
  return pages;
}
