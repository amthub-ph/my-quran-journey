import { parseVerseKey } from "@/lib/quran";
import { loadChapterTranslation } from "@/lib/chapter-translations";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ surah: string }> }) {
  const { surah } = await params;
  const language = new URL(request.url).searchParams.get("language");
  try { parseVerseKey(`${surah}:1`); } catch { return Response.json({ error: "invalid_surah" }, { status: 400 }); }
  if (language !== "english" && language !== "tagalog") return Response.json({ error: "invalid_language" }, { status: 400 });
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return Response.json({ error: "sign_in" }, { status: 401 });
  try {
    return Response.json(await loadChapterTranslation(Number(surah), language), { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ error: "translation_unavailable" }, { status: 503 }); }
}
