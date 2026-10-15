export type ScheduledReminder = {
  id: string | number; user_id: string; title: string; reminder_time: string;
  days_of_week: number[]; timezone: string; enabled: boolean; created_at: string;
};

// A five-minute recovery window handles a delayed scheduler without sending hours-old alarms.
export function dueOccurrence(reminder: ScheduledReminder, now: number): string | null {
  if (!reminder.enabled || !/^\d{2}:\d{2}/.test(reminder.reminder_time)) return null;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: reminder.timezone, year: "numeric", month: "2-digit", day: "2-digit",
    weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const created = Date.parse(reminder.created_at);
  if (!Number.isFinite(created)) return null;
  for (let offset = 0; offset < 5; offset++) {
    const instant = Math.floor(now / 60000) * 60000 - offset * 60000;
    if (instant < created) continue;
    const parts = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]));
    if (reminder.days_of_week.includes(weekdays.indexOf(parts.weekday)) && `${parts.hour}:${parts.minute}` === reminder.reminder_time.slice(0, 5)) {
      // Local date prevents a duplicate reminder during the repeated DST hour.
      return `${parts.year}-${parts.month}-${parts.day}/${reminder.reminder_time.slice(0, 5)}`;
    }
  }
  return null;
}
