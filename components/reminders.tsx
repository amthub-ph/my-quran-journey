"use client";
import { useI18n } from "@/components/language-provider";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Reminder = {
  id: number;
  user_id: string;
  title: string;
  reminder_time: string;
  days_of_week: number[];
  timezone: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

const DAYS = [
  { value: 0, short: "Sun" },
  { value: 1, short: "Mon" },
  { value: 2, short: "Tue" },
  { value: 3, short: "Wed" },
  { value: 4, short: "Thu" },
  { value: 5, short: "Fri" },
  { value: 6, short: "Sat" },
];

export function Reminders() {
const { t, language } = useI18n();

  const db = useMemo(() => createClient(), []);

  const [items, setItems] = useState<Reminder[]>([]);
  const [title, setTitle] = useState(t("Qur'an Reading Reminder"));
  const [time, setTime] = useState("20:00");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila"
      : "Asia/Manila";

  const everyDay = days.length === 7;

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await db.auth.getUser();

    if (!user) {
      setMessage("Please sign in again.");
      return;
    }

    const { data, error } = await db
      .from("journey_reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Could not load reminders: ${error.message}`);
      return;
    }

    setItems((data ?? []) as Reminder[]);
  }, [db]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  }

  function selectEveryDay() {
    setDays([0, 1, 2, 3, 4, 5, 6]);
  }

  async function saveReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Enter a reminder title.");
      return;
    }

    if (!time) {
      setMessage("Choose a reminder time.");
      return;
    }

    if (days.length === 0) {
      setMessage("Choose at least one day.");
      return;
    }

    setBusy(true);
    setMessage("Saving reminder...");

    try {
      const {
        data: { user },
      } = await db.auth.getUser();

      if (!user) {
        setMessage("Please sign in again.");
        return;
      }

      const { error } = await db.from("journey_reminders").insert({
        user_id: user.id,
        title: title.trim(),
        reminder_time: time,
        days_of_week: days,
        timezone,
        enabled: true,
      });

      if (error) {
        setMessage(`Reminder could not be saved: ${error.message}`);
        return;
      }

      setMessage("Reminder saved.");
      await refresh();
    } catch {
      setMessage("Reminder could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }
async function enableNotifications() {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setMessage("Push notifications are not supported on this device.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      setMessage("Notification permission was not granted.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    const existingSubscription =
      await registration.pushManager.getSubscription();

    if (existingSubscription) {
      setMessage("Notifications are already enabled.");
      return;
    }

    const response = await fetch("/api/push/subscribe", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(t("Could not get push notification settings."));
    }

    const { publicKey } = await response.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });

    const saveResponse = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    if (!saveResponse.ok) {
      throw new Error(t("Could not save notification subscription."));
    }

    setMessage("Notifications enabled successfully.");
  } catch (error) {
    console.error(error);
    setMessage("Could not enable notifications. Please try again.");
  }
}


  async function toggleReminder(item: Reminder) {
    setBusy(true);

    const { error } = await db
      .from("journey_reminders")
      .update({
        enabled: !item.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setMessage(`Could not update reminder: ${error.message}`);
    } else {
      setMessage(item.enabled ? t("Reminder turned off.") : t("Reminder turned on."));
      await refresh();
    }

    setBusy(false);
  }

  async function deleteReminder(id: number) {
    setBusy(true);

    const { error } = await db
      .from("journey_reminders")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(`Could not delete reminder: ${error.message}`);
    } else {
      setMessage("Reminder deleted.");
      await refresh();
    }

    setBusy(false);
  }

  function formatTime(value: string) {
    const [hoursText, minutesText] = value.split(":");
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return new Intl.DateTimeFormat(language, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function formatDays(selectedDays: number[]) {
    if (selectedDays.length === 7) return t("Every day");

    return DAYS.filter((day) => selectedDays.includes(day.value))
      .map((day) => t(day.short))
      .join(" · ");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <form onSubmit={saveReminder} className="quran-card p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">{t("Set a reading reminder")}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("Choose when you would like to be reminded to continue your Qur'an journey.")}{" "}</p>
        </div>

        <label className="block">
          <span className="font-medium">{t("Reminder title")}</span>

          <input
            type="text"
            className="journey-input mt-2 w-full"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("Qur'an Reading Reminder")}
            maxLength={80}
          />
        </label>

        <label className="block">
          <span className="font-medium">{t("Time")}</span>

          <input
            type="time"
            className="journey-input mt-2 w-full"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
          />
        </label>

        <div>
          <p className="font-medium">{t("Repeat")}</p>

          <button
            type="button"
            className={`mt-3 ${
              everyDay ? "quran-btn-primary" : "quran-btn-secondary"
            }`}
            onClick={selectEveryDay}
          >
            {t("Every day")}{" "}</button>

          <div className="mt-4 flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const selected = days.includes(day.value);

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={
                    selected ? "quran-btn-primary" : "quran-btn-secondary"
                  }
                  aria-pressed={selected}
                >
                  {t(day.short)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-sm text-[var(--muted)]">
          {t("Time zone:")}{" "}{timezone}
        </div>

        
        <div className="flex flex-wrap gap-3">
         <button
  type="submit"
          className="quran-btn-primary"
          disabled={busy}
        >
          {busy ? t("Saving...") : t("Save Reminder")}
        </button>

        <button
  type="button"
  className="quran-btn-secondary"
  onClick={enableNotifications}
>
  {t("Enable Notifications")}{" "}</button>
</div>

        <p aria-live="polite" className="text-sm min-h-6">
          {t(message)}
        </p>
      </form>

      <section className="space-y-4" aria-label={t("Saved reminders")}>
        <div>
          <h2 className="text-2xl font-semibold">{t("Your reminders")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t("Manage your Qur'an reading schedule.")}{" "}</p>
        </div>

        {items.length === 0 ? (
          <div className="quran-card p-6">
            <p>{t("No reminders have been created yet.")}</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="quran-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--muted)]">
                    {item.enabled ? t("Alarm on") : t("Alarm off")}
                  </p>

                  <h3 className="mt-1 text-xl font-semibold">{item.title}</h3>

                  <p className="mt-3 text-3xl font-semibold">
                    {formatTime(item.reminder_time)}
                  </p>

                  <p className="mt-2 text-sm">
                    {formatDays(item.days_of_week)}
                  </p>
                </div>

                <button
                  type="button"
                  className={
                    item.enabled ? "quran-btn-primary" : "quran-btn-secondary"
                  }
                  disabled={busy}
                  onClick={() => toggleReminder(item)}
                >
                  {item.enabled ? t("ON") : t("OFF")}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="quran-btn-secondary"
                  disabled={busy}
                  onClick={() => toggleReminder(item)}
                >
                  {item.enabled ? t("Turn Off") : t("Turn On")}
                </button>

                <button
                  type="button"
                  className="quran-btn-secondary"
                  disabled={busy}
                  onClick={() => deleteReminder(item.id)}
                >
                  {t("Delete")}{" "}</button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
