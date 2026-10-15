import { parseVerseKey } from "@/lib/quran";
import { loadChapterTranslation } from "@/lib/chapter-translations";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      surah: string;
    }>;
  },
) {
  const { surah } = await params;

  const language =
    new URL(
      request.url,
    ).searchParams.get(
      "language",
    );

  try {
    parseVerseKey(
      `${surah}:1`,
    );
  } catch {
    return Response.json(
      {
        error:
          "invalid_surah",
      },
      {
        status: 400,
      },
    );
  }

  if (
    language !==
      "english" &&
    language !==
      "tagalog"
  ) {
    return Response.json(
      {
        error:
          "invalid_language",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const translation =
      await loadChapterTranslation(
        Number(surah),
        language,
      );

    return Response.json(
      translation,
      {
        headers: {
          "Cache-Control":
            "public, max-age=3600",
        },
      },
    );
  } catch {
    return Response.json(
      {
        error:
          "translation_unavailable",
      },
      {
        status: 503,
      },
    );
  }
}