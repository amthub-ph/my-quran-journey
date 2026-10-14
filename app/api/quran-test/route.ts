import { quranClient } from "@/lib/quran-api";

export async function GET() {
  try {
    const verse = await quranClient.content.v4.verses.byKey("1:2", {
      translations: [85],
    });

    return Response.json({
      success: true,
      verse,
    });
  } catch (error) {
    console.error("Quran Foundation verse test failed:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}