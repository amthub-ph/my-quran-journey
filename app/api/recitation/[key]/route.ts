import { loadRecitation } from "@/lib/recitation-server";
import { parseVerseKey } from "@/lib/quran";
import { isReciterId } from "@/lib/reciters";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ key: string }>;
  },
) {
  const { key } = await params;

  const reciter = new URL(request.url).searchParams.get("reciter");

  try {
    parseVerseKey(key);
  } catch {
    return Response.json(
      {
        error: "invalid_verse",
      },
      {
        status: 400,
      },
    );
  }

  if (!isReciterId(reciter)) {
    return Response.json(
      {
        error: "invalid_reciter",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const result = await loadRecitation(
      key,
      reciter,
    );

    return Response.json(result, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return Response.json(
      {
        error: "audio_unavailable",
      },
      {
        status: 503,
      },
    );
  }
}