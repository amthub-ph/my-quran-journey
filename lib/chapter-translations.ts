import "server-only";
import { parseVerseKey } from "./quran";
import { qf } from "./quran-server";
import type { ChapterTranslation, ReadingVerse } from "./reading-layout";

function validateVerses(surah: number, verses: ReadingVerse[]) {
  const { chapter } = parseVerseKey(`${surah}:1`);
  if (verses.length !== chapter.verses_count || verses.some((verse, index) => verse.key !== `${surah}:${index + 1}` || typeof verse.text !== "string" || !verse.text.trim())) {
    throw new Error("Incomplete or mismatched chapter translation");
  }
  return verses;
}
async function foundationChapter(surah: number): Promise<ChapterTranslation> {
  const { chapter } = parseVerseKey(`${surah}:1`);
  const translationId = Number(process.env.QF_TRANSLATION_ID || 85);
  const [catalogue, ...pages] = await Promise.all([
    qf("resources/translations?language=en"),
    ...Array.from({ length: Math.ceil(chapter.verses_count / 50) }, (_, page) =>
      qf(`verses/by_chapter/${surah}?translations=${translationId}&per_page=50&page=${page + 1}&words=false`)),
  ]);
  const resources = catalogue.translations as { id: number; language_name?: string; author_name?: string; name?: string }[];
  const translator = resources?.find(item => item.id === translationId && item.language_name?.toLowerCase() === "english");
  if (!translator || !(translator.author_name || translator.name)) throw new Error("Unknown translation resource");
  const verses = pages.flatMap(page => {
    if (!Array.isArray(page.verses)) throw new Error("Invalid translation page");
    return page.verses.map((verse: { verse_key: string; translations?: { resource_id: number; text: string }[] }) => ({
      key: verse.verse_key, text: verse.translations?.find(item => item.resource_id === translationId)?.text || "",
    }));
  });
  return { surah, language: "english", verses: validateVerses(surah, verses), fallback: false,
    source: { name: translator.author_name || translator.name!, url: `https://quran.com/${surah}`, provider: "Quran Foundation" } };
}
async function quranEncChapter(surah: number, language: "english" | "tagalog", fallback: boolean): Promise<ChapterTranslation> {
  const editionKey = language === "english" ? "english_rwwad" : "tagalog_rwwad";
  const locale = language === "english" ? "en" : "tl";
  const options = { next: { revalidate: 86400 }, signal: AbortSignal.timeout(12000) };
  const [catalogueResponse, chapterResponse] = await Promise.all([
    fetch(`https://quranenc.com/api/v1/translations/list/${locale}`, options),
    fetch(`https://quranenc.com/api/v1/translation/sura/${editionKey}/${surah}`, options),
  ]);
  if (!catalogueResponse.ok || !chapterResponse.ok) throw new Error("Translation unavailable");
  const catalogue = await catalogueResponse.json();
  const entries = Array.isArray(catalogue) ? catalogue : catalogue.translations;
  const edition = entries?.find((item: { key: string }) => item.key === editionKey);
  if (!edition?.version || typeof edition.title !== "string") throw new Error("Unknown translation edition");
  const body = await chapterResponse.json();
  const rows = Array.isArray(body) ? body : body.result;
  if (!Array.isArray(rows)) throw new Error("Invalid chapter translation");
  const verses = rows.map((row: { sura: string | number; aya: string | number; translation: string; footnotes?: string }) => ({
    key: `${Number(row.sura)}:${Number(row.aya)}`, text: row.translation,
    footnotes: typeof row.footnotes === "string" ? row.footnotes : undefined,
  }));
  return { surah, language, verses: validateVerses(surah, verses), fallback,
    source: { name: edition.title, description: typeof edition.description === "string" ? edition.description : undefined,
      url: `https://quranenc.com/${locale}/browse/${editionKey}/${surah}`, provider: "QuranEnc", version: String(edition.version) } };
}
export async function loadChapterTranslation(surah: number, language: "english" | "tagalog"): Promise<ChapterTranslation> {
  parseVerseKey(`${surah}:1`);
  if (language !== "english" && language !== "tagalog") throw new Error("Invalid reading language");
  if (language === "english" && process.env.QF_CLIENT_ID && process.env.QF_CLIENT_SECRET && (process.env.QF_ENV === "production" || surah <= 2)) {
    try { return await foundationChapter(surah); } catch { /* Use one complete, attributed edition for the whole chapter. */ }
  }
  return quranEncChapter(surah, language, language === "english");
}
