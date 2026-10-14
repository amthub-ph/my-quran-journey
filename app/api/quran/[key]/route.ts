import { loadVerse } from "@/lib/quran-server";
import { parseVerseKey } from "@/lib/quran";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: Request, { params }: { params: Promise<{key:string}> }) {
  const { key } = await params;
  try { parseVerseKey(key); } catch { return Response.json({error:"Invalid verse"}, {status:400}); }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({error:"Please sign in again."}, {status:401});
  try {
    return Response.json(await loadVerse(key, new URL(request.url).searchParams.get("language") || "english"), { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({error:"Arabic text could not be loaded. Please retry."}, {status:503}); }
}
