import "server-only";
import webpush from "web-push";

export type Device = { endpoint: string; p256dh: string; auth: string; user_id: string };
type PushError = Error & { statusCode?: number };

export function validEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      (url.hostname === "fcm.googleapis.com" || url.hostname === "updates.push.services.mozilla.com" ||
       url.hostname.endsWith(".notify.windows.com") || url.hostname === "web.push.apple.com" ||
       url.hostname.endsWith(".push.apple.com"));
  } catch { return false; }
}

export function pushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

export async function sendPush(device: Device, title: string, tag: string) {
  if (!pushConfigured()) throw new Error("Server notification keys are not configured.");
  if (!validEndpoint(device.endpoint)) throw new Error("Unsupported push service.");
  try {
    await webpush.sendNotification({ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
      JSON.stringify({ title, body: "Continue your Qur'an journey from where you left off.", tag, url: "/progress" }), {
        TTL: 300, urgency: "high", timeout: 10000,
        vapidDetails: { subject: process.env.VAPID_SUBJECT!, publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, privateKey: process.env.VAPID_PRIVATE_KEY! },
      });
    return "accepted" as const;
  } catch (error) {
    if ([404, 410].includes((error as PushError).statusCode ?? 0)) return "expired" as const;
    throw error;
  }
}
