"use client";

import { useState } from "react";

import { GuestAuthModal } from "@/components/guest-auth-modal";

type Feature =
  | "progress"
  | "reflections"
  | "bookmarks"
  | "reminders";

export function GuestFeatureNav({
  isArabic,
}: {
  isArabic: boolean;
}) {
  const [
    activeFeature,
    setActiveFeature,
  ] = useState<Feature | null>(
    null,
  );

  function closeModal() {
    setActiveFeature(null);
  }

  const content = {
    progress: {
      label: isArabic
        ? "◷ التقدم"
        : "◷ Progress",

      title: isArabic
        ? "احفظ تقدمك"
        : "Save Your Progress",

      description: isArabic
        ? "أنشئ حسابًا أو سجّل الدخول لحفظ تقدم قراءتك بشكل دائم ومتابعة رحلتك مع القرآن في أي وقت."
        : "Create an account or sign in to save your reading progress permanently and continue your Qur’an journey anytime.",
    },

    reflections: {
      label: isArabic
        ? "✦ التأملات"
        : "✦ Reflections",

      title: isArabic
        ? "احفظ تأملاتك"
        : "Save Your Reflections",

      description: isArabic
        ? "أنشئ حسابًا أو سجّل الدخول لإضافة تأملاتك وحفظها مع الآيات التي تقرؤها."
        : "Create an account or sign in to add reflections and keep them connected to the ayahs you read.",
    },

    bookmarks: {
      label: isArabic
        ? "🔖 الإشارات المرجعية"
        : "🔖 Bookmarks",

      title: isArabic
        ? "احفظ الآيات المفضلة"
        : "Save Your Bookmarks",

      description: isArabic
        ? "أنشئ حسابًا أو سجّل الدخول لحفظ الآيات والعودة إليها بسهولة في رحلتك القادمة."
        : "Create an account or sign in to bookmark meaningful ayahs and return to them easily later.",
    },

    reminders: {
      label: isArabic
        ? "◷ التذكيرات"
        : "◷ Reminders",

      title: isArabic
        ? "اضبط تذكيرات القراءة"
        : "Set Reading Reminders",

      description: isArabic
        ? "أنشئ حسابًا أو سجّل الدخول لإنشاء تذكيرات تساعدك على الاستمرار في قراءة القرآن بانتظام."
        : "Create an account or sign in to set reading reminders and build a consistent Qur’an reading routine.",
    },
  };

  const modalContent =
    activeFeature
      ? content[activeFeature]
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setActiveFeature(
            "progress",
          )
        }
        className="rounded-xl px-4 py-3 text-[#17372C] transition hover:bg-[#F3EEE2] hover:text-[#315C4B]"
      >
        {
          content.progress
            .label
        }
      </button>

      <button
        type="button"
        onClick={() =>
          setActiveFeature(
            "reflections",
          )
        }
        className="rounded-xl px-4 py-3 text-[#17372C] transition hover:bg-[#F3EEE2] hover:text-[#315C4B]"
      >
        {
          content.reflections
            .label
        }
      </button>

      <button
        type="button"
        onClick={() =>
          setActiveFeature(
            "bookmarks",
          )
        }
        className="rounded-xl px-4 py-3 text-[#17372C] transition hover:bg-[#F3EEE2] hover:text-[#315C4B]"
      >
        {
          content.bookmarks
            .label
        }
      </button>

      <button
        type="button"
        onClick={() =>
          setActiveFeature(
            "reminders",
          )
        }
        className="rounded-xl px-4 py-3 text-[#17372C] transition hover:bg-[#F3EEE2] hover:text-[#315C4B]"
      >
        {
          content.reminders
            .label
        }
      </button>

      <GuestAuthModal
        open={
          activeFeature !==
          null
        }
        onClose={
          closeModal
        }
        title={
          modalContent?.title
        }
        description={
          modalContent?.description
        }
      />
    </>
  );
}