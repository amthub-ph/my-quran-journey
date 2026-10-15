import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPush, pushConfigured, type Device } from "@/lib/push-server";

export const runtime = "nodejs";
export async function POST() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ error: "Server notification keys are not configured." }, { status: 503 });
  const { data, error } = await db.from("push_subscriptions").select("endpoint,p256dh,auth,user_id").eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not read registered devices." }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "Enable notifications to register this device first." }, { status: 409 });
  let accepted = 0;
  for (const device of data as Device[]) {
    try {
      const result = await sendPush(device, "Test: time to read the Qur'an", "quran-reminder-test");
      if (result === "accepted") accepted++;
      else await db.from("push_subscriptions").delete().eq("endpoint", device.endpoint).eq("user_id", user.id);
    } catch { /* Report delivery failure without exposing endpoints or keys. */ }
  }
  return accepted ? NextResponse.json({ accepted }) : NextResponse.json({ error: "Push delivery failed. Re-enable notifications; check the server VAPID key pair if this continues." }, { status: 502 });
}
