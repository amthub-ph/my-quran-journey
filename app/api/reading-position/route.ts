import { saveSurahJourney } from "@/app/actions/surah-journey";

// Revalidation in a route handler updates future visits without replacing the active reader.
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (typeof body?.key !== "string") return Response.json({ error: "Invalid position." }, { status: 400 });
    const result = await saveSurahJourney(body.key, body.mode ?? "save");
    return Response.json(result, { status: result.error ? 400 : 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Progress could not be saved. Please try again." }, { status: 400 });
  }
}
