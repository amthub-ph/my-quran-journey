"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function Pwa() {
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
            "App background support could not start. Refresh and try again."
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
  }, []);

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
    if (!("Notification" in window)) {
      setMessage("Notifications are not supported by this browser.");
      setNotificationPermission("unsupported");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setMessage("Background notifications are not supported by this browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        await navigator.serviceWorker.ready;
        setMessage(
          "Notifications enabled. Next we will connect this device to your saved reminders."
        );
      } else if (permission === "denied") {
        setMessage(
          "Notifications are blocked. Allow notifications for this site in your browser settings."
        );
      } else {
        setMessage("Notification permission was not enabled.");
      }
    } catch {
      setMessage("Notifications could not be enabled.");
    }
  }

  async function testNotification() {
    if (!("Notification" in window)) {
      setMessage("Notifications are not supported by this browser.");
      return;
    }

    if (Notification.permission !== "granted") {
      setMessage("Enable notifications first.");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setMessage("Background notifications are unavailable.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification("Time to read the Qur'an", {
        body: "Continue your Qur'an journey from where you left off.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "quran-reminder-test",
        data: {
          url: "/progress",
        },
      });

      setMessage("Test notification sent.");
    } catch {
      setMessage("The test notification could not be sent.");
    }
  }

  return (
    <aside
      className="quran-container py-6 text-sm"
      aria-label="App installation and notification status"
    >
      <div className="flex flex-wrap gap-3">
        {installPrompt && (
          <button
            type="button"
            className="quran-btn-secondary"
            onClick={installApp}
          >
            Install App
          </button>
        )}

        <button
          type="button"
          className="quran-btn-secondary"
          onClick={enableNotifications}
        >
          {notificationPermission === "granted"
            ? "Notifications Enabled"
            : "Enable Notifications"}
        </button>

        {notificationPermission === "granted" && (
          <button
            type="button"
            className="quran-btn-secondary"
            onClick={testNotification}
          >
            Test Notification
          </button>
        )}
      </div>

      {notificationPermission === "granted" && (
        <p className="mt-3">
          Notifications are allowed on this device.
        </p>
      )}

      {message && (
        <p role="status" className="journey-warning mt-3">
          {message}
        </p>
      )}
    </aside>
  );
}