import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { dueOccurrence, type ScheduledReminder } from "@/lib/push-schedule";
import { sendPush, pushConfigured, type Device } from "@/lib/push-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !pushConfigured()) {
    return NextResponse.json({ error: "Reminder delivery is not configured." }, { status: 503 });
  }
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const started = Date.now();
  let accepted = 0, failed = 0;
  for (let page = 0; ; page++) {
    const { data, error } = await db.from("journey_reminders").select("id,user_id,title,reminder_time,days_of_week,timezone,enabled,created_at").eq("enabled", true).order("id").range(page * 100, page * 100 + 99);
    if (error) return NextResponse.json({ error: "Could not load reminder schedules. Check the database schema." }, { status: 500 });
    for (const reminder of data as ScheduledReminder[]) {
      if (Date.now() - started > 45000) return NextResponse.json({ accepted, failed, error: "Delivery time budget exceeded; retry required." }, { status: 503 });
      let occurrence: string | null;
      try { occurrence = dueOccurrence(reminder, started); } catch { failed++; continue; }
      if (!occurrence) continue;
      const { data: devices, error: deviceError } = await db.from("push_subscriptions").select("endpoint,p256dh,auth,user_id").eq("user_id", reminder.user_id);
      if (deviceError) { failed++; continue; }
      for (const device of (devices ?? []) as Device[]) {
        const claim = { reminder_key: String(reminder.id), occurrence_key: occurrence, device_endpoint: device.endpoint };
        const { data: claimed, error: claimError } = await db.rpc("claim_reminder_delivery", claim);
        if (claimError) { failed++; continue; }
        if (!claimed) continue;
        try {
          const result = await sendPush(device, reminder.title || "Time to read the Qur'an", `quran-${reminder.id}-${occurrence}`);
          if (result === "expired") await db.from("push_subscriptions").delete().eq("endpoint", device.endpoint).eq("user_id", device.user_id);
          const { error: saved } = await db.from("reminder_deliveries").update({ status: result === "accepted" ? "sent" : "expired" }).eq("reminder_id", String(reminder.id)).eq("occurrence", occurrence).eq("endpoint", device.endpoint);
          if (saved) failed++; else if (result === "accepted") accepted++;
        } catch {
          failed++;
          await db.from("reminder_deliveries").update({ status: "failed" }).eq("reminder_id", String(reminder.id)).eq("occurrence", occurrence).eq("endpoint", device.endpoint);
        }
      }
    }
    if (data.length < 100) break;
  }
  return NextResponse.json({ accepted, failed }, { status: failed ? 503 : 200 });
}
