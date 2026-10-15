import chapters from "@/data/chapters.json";
export { chapters };
export function parseVerseKey(key: string) {
  if (!/^[1-9]\d{0,2}:[1-9]\d{0,2}$/.test(key)) throw new Error("Invalid verse key");
  const [surah, ayah] = key.split(":").map(Number);
  const chapter = chapters.find((item) => item.id === surah);
  if (!chapter || ayah > chapter.verses_count) throw new Error("Invalid verse key");
  return { surah, ayah, chapter };
}
export function positionPercent(key: string) {
  const { ayah, chapter } = parseVerseKey(key);
  return ayah === chapter.verses_count ? 100 : Math.min(99, Math.round(ayah / chapter.verses_count * 100));
}
export type VerseContent = {
  key: string; arabic: string; english?: string; englishSource?: string;
  tagalog?: string; tagalogFootnotes?: string; tagalogVersion?: string;
  audio?: string; reciter?: string; notices: string[];
};
