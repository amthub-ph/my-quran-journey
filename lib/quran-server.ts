import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chapters, parseVerseKey, type VerseContent } from "./quran";
let arabicPromise: Promise<Map<string, string>> | undefined;
export function arabicText() {
  return arabicPromise ??= readFile(path.join(process.cwd(), "data/quran-uthmani.txt"), "utf8").then((raw) => {
    const map = new Map<string, string>();
    for (const line of raw.split(/\r?\n/)) {
      const match = /^(\d+)\|(\d+)\|(.+)$/.exec(line);
      if (!match) continue;
      const key = `${match[1]}:${match[2]}`;
      parseVerseKey(key);
      if (map.has(key)) throw new Error("Duplicate Arabic verse");
      map.set(key, match[3]);
    }
    if (map.size !== 6236 || chapters.some(c => Array.from({length:c.verses_count}, (_, i) => `${c.id}:${i+1}`).some(k => !map.has(k)))) throw new Error("The Tanzil file failed the complete-Quran integrity check.");
    return map;
  });
}
let token: { value: string; expires: number } | undefined;
let pendingToken: Promise<string> | undefined;
const production = process.env.QF_ENV === "production";
const gateway = production ? "https://apis.quran.foundation" : "https://apis-prelive.quran.foundation";
async function getToken() {
  if (token && token.expires > Date.now()) return token.value;
  if (pendingToken) return pendingToken;
  pendingToken = (async () => {
    const id = process.env.QF_CLIENT_ID, secret = process.env.QF_CLIENT_SECRET;
    if (!id || !secret) throw new Error("Quran Foundation credentials are not configured. Arabic remains available.");
    const host = production ? "https://oauth2.quran.foundation" : "https://prelive-oauth2.quran.foundation";
    const response = await fetch(`${host}/oauth2/token`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
      headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials&scope=content",
    });
    if (!response.ok) throw new Error("Quran Foundation authentication is unavailable. Check server credentials.");
    const body = await response.json();
    if (typeof body.access_token !== "string") throw new Error("Invalid content token response");
    token = { value: body.access_token, expires: Date.now() + (Number(body.expires_in || 3600) - 60) * 1000 };
    return token.value;
  })();
  try { return await pendingToken; } finally { pendingToken = undefined; }
}
export async function qf(endpoint: string, retry = true): Promise<Record<string, unknown>> {
  const access = await getToken();
  const response = await fetch(`${gateway}/content/api/v4/${endpoint}`, {
    headers: { "x-auth-token": access, "x-client-id": process.env.QF_CLIENT_ID! },
    cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  if (response.status === 401 && retry) { token = undefined; return qf(endpoint, false); }
  if (!response.ok) throw new Error(`Quran Foundation content is unavailable (${response.status}).${!production ? " Pre-live access covers surahs 1–2 only." : " Please try again later."}`);
  return response.json();
}
type Resource = { id: number; name?: string; author_name?: string; reciter_name?: string; language_name?: string };
type QFVerse = { verse_key: string; translations?: { resource_id: number; text: string }[]; audio?: { url?: string } };
async function foundation(key: string) {
  const translationId = Number(process.env.QF_TRANSLATION_ID || 85)

  const [translationList, data] = await Promise.all([
    qf("resources/translations?language=en"),
    qf(`verses/by_key/${key}?translations=${translationId}`),
  ]);
  const translator = (translationList.translations as Resource[]).find(r => r.id === translationId && r.language_name?.toLowerCase() === "english");
  const verse = data.verse as QFVerse;
  if (verse?.verse_key !== key || !translator) throw new Error("Quran Foundation resource validation failed.");
  const translation = verse.translations?.find(t => t.resource_id === translationId);
  return { english: translation?.text, englishSource: translator.author_name || translator.name };
}
async function tagalog(key: string) {
  const { surah, ayah } = parseVerseKey(key);
  const options = { next: { revalidate: 86400 }, signal: AbortSignal.timeout(12000) };
  const [catalogResponse, verseResponse] = await Promise.all([
    fetch("https://quranenc.com/api/v1/translations/list/tl", options),
    fetch(`https://quranenc.com/api/v1/translation/aya/tagalog_rwwad/${surah}/${ayah}`, options),
  ]);
  if (!catalogResponse.ok || !verseResponse.ok) throw new Error("Tagalog translation is temporarily unavailable.");
  const catalog = await catalogResponse.json();
  const entries = Array.isArray(catalog) ? catalog : catalog.translations;
  const edition = entries?.find((r: {key:string}) => r.key === "tagalog_rwwad");
  const { result } = await verseResponse.json();
  if (!edition?.version || Number(result?.sura) !== surah || Number(result?.aya) !== ayah || typeof result?.translation !== "string") throw new Error("Tagalog source validation failed.");
  return { tagalog: result.translation, tagalogFootnotes: result.footnotes, tagalogVersion: String(edition.version) };
}
export async function loadVerse(key: string, language: string): Promise<VerseContent> {
  parseVerseKey(key);
  const result: VerseContent = { key, arabic: (await arabicText()).get(key)!, notices: [] };
  const outcomes = await Promise.allSettled([foundation(key), language === "tagalog" ? tagalog(key) : Promise.resolve({})]);
  for (const outcome of outcomes) {
    if (outcome.status === "fulfilled") Object.assign(result, outcome.value);
    else result.notices.push(outcome.reason instanceof Error ? outcome.reason.message : "Content temporarily unavailable.");
  }
  return result;
}
