"use client";

import { useState } from "react";

export function GuestSaveButton({
  label,
  savedLabel,
}: {
  label: string;
  savedLabel: string;
}) {
  const [saved, setSaved] =
    useState(false);

  function saveGuestJourney() {
    window.dispatchEvent(
      new Event(
        "quran-guest-save",
      ),
    );

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      2500,
    );
  }

  return (
    <button
      type="button"
      onClick={
        saveGuestJourney
      }
      className="shrink-0 rounded-full bg-[#315C4B] px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#264A3D]"
    >
      {saved
        ? savedLabel
        : label}
    </button>
  );
}