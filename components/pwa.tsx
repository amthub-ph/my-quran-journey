"use client";
import { useI18n } from "@/components/language-provider";

import { useEffect, useState } from "react";
import { enablePush, testPush } from "@/lib/push-client";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function Pwa() {
const { t } = useI18n();

  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [message, setMessage] = useState("");
  const [notificationPermission, setNotificationPermission] =
    useState<string>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission("unsupported");
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() =>
          setMessage(
            t("App background support could not start. Refresh and try again.")
          )
        );
    }

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, [t]);

  async function installApp() {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setMessage("My Qur'an Journey was installed.");
      }

      setInstallPrompt(null);
    } catch {
      setMessage("The app could not be installed.");
    }
  }

  async function enableNotifications() {
    try {
      await enablePush();
      setNotificationPermission("granted");
      setMessage("This device is registered for reminders. Use Test Notification to check delivery.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable notifications.");
    }
  }

  async function testNotification() {
    try {
      setMessage("Testing notification delivery...");
      setMessage(await testPush());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The notification test failed.");
    }
  }

  return (
    <aside
      className="quran-container py-6 text-sm"
      aria-label={t("App installation and notification status")}
    >
      <div className="flex flex-wrap gap-3">
        {installPrompt && (
          <button
            type="button"
            className="quran-btn-secondary"
            onClick={installApp}
          >
            {t("Install App")}{" "}</button>
        )}

        <button
          type="button"
          className="quran-btn-secondary"
          onClick={enableNotifications}
        >
          {notificationPermission === "granted"
            ? t("Connect Notifications")
            : t("Enable Notifications")}
        </button>

        {notificationPermission === "granted" && (
          <button
            type="button"
            className="quran-btn-secondary"
            onClick={testNotification}
          >
            {t("Test Notification")}{" "}</button>
        )}
      </div>

      {notificationPermission === "granted" && (
        <p className="mt-3">
          {t("Notifications are allowed on this device.")}{" "}</p>
      )}

      {message && (
        <p role="status" className="journey-warning mt-3">
          {t(message)}
        </p>
      )}
    </aside>
  );
}
