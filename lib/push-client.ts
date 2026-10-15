"use client";

async function registration() {
  if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Push notifications are unavailable in this browser. Try Chrome, or install this app on your iPhone home screen.");
  }
  await navigator.serviceWorker.register("/sw.js");
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("Notification support did not start. Refresh and try again.")), 12000)),
  ]);
}

export async function enablePush() {
  if (!("Notification" in window)) throw new Error("Notifications are unavailable in this browser.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Allow notifications for this site in your browser settings, then try again.");
  const worker = await registration();
  const response = await fetch("/api/push/subscribe");
  const settings = await response.json();
  if (!response.ok || !settings.publicKey) throw new Error(settings.error || "Notification settings are unavailable.");
  const raw = atob(settings.publicKey.replace(/-/g, "+").replace(/_/g, "/"));
  const key = Uint8Array.from(raw, (character) => character.charCodeAt(0));
  let subscription = await worker.pushManager.getSubscription();
  const existingKey = subscription?.options.applicationServerKey;
  if (subscription && existingKey && (existingKey.byteLength !== key.length || new Uint8Array(existingKey).some((value, index) => value !== key[index]))) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ??= await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  // Persist even an existing subscription: a prior save may have failed or the account changed.
  const saved = await fetch("/api/push/subscribe", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription),
  });
  if (!saved.ok) {
    const result = await saved.json();
    throw new Error(result.error || "Could not save this device for reminders.");
  }
}

export async function testPush() {
  await enablePush();
  const response = await fetch("/api/push/test", { method: "POST" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The notification delivery test failed.");
  return "Test accepted by the push service. Check your device notifications; this does not confirm that a banner appeared.";
}
