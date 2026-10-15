import "server-only";
import { chapters, parseVerseKey } from "./quran";
import { isReciterId } from "./reciters";

export async function loadRecitation(key: string, reciter: string) {
  const { surah, ayah } = parseVerseKey(key);
  if (!isReciterId(reciter)) throw new Error("Unsupported reciter");
  if (reciter === "Yasser_Ad-Dussary_128kbps") {
    // EveryAyah publishes this directory and its six-digit chapter/ayah filenames.
    // Confirm the requested file exists and is audio before exposing it to the player.
    const filename = `${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}.mp3`;
    const audio = `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${filename}`;
    const response = await fetch(audio, {
      method: "HEAD", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(12000),
    });
    if (!response.ok || !response.headers.get("content-type")?.toLowerCase().startsWith("audio/")) {
      throw new Error("Recitation unavailable");
    }
    return { key, reciter, audio };
  }
  const response = await fetch(`https://api.alquran.cloud/v1/ayah/${key}/${reciter}`, {
    next: { revalidate: 86400 }, signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Recitation unavailable");
  const { data, code } = await response.json();
  const number = chapters.filter(c => c.id < surah).reduce((sum, c) => sum + c.verses_count, 0) + ayah;
  if (code !== 200 || data?.surah?.number !== surah || data?.numberInSurah !== ayah ||
      data?.number !== number || data?.edition?.identifier !== reciter || data?.edition?.format !== "audio") {
    throw new Error("Recitation response mismatch");
  }
  // Use the provider response; never construct or guess individual audio URLs.
  const audio = new URL(data.audio);
  if (audio.protocol !== "https:" || audio.hostname !== "cdn.islamic.network" || audio.username || audio.password || audio.port) {
    throw new Error("Unexpected audio provider URL");
  }
  return { key, reciter, audio: audio.href };
}
