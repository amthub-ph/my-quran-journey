import { loadRecitation } from "@/lib/recitation-server";
import { parseVerseKey } from "@/lib/quran";
import { isReciterId } from "@/lib/reciters";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const reciter = new URL(request.url).searchParams.get("reciter");
  try { parseVerseKey(key); } catch { return Response.json({ error: "invalid_verse" }, { status: 400 }); }
  if (!isReciterId(reciter)) return Response.json({ error: "invalid_reciter" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "sign_in" }, { status: 401 });
  try {
    return Response.json(await loadRecitation(key, reciter), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "audio_unavailable" }, { status: 503 });
  }
}
