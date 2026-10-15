"use client";
import { useI18n } from "@/components/language-provider";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
const { t, language, changeLanguage, busy: changingLanguage } = useI18n();

 
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const interfaceLanguage = language === "ar" ? "arabic" : "english";
  const [quranDisplay, setQuranDisplay] = useState("arabic_english");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please sign in first.");
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName.trim(),
      interface_language: interfaceLanguage,
      quran_display: quranDisplay,
    });

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

   window.location.href = "/protected";
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <div className="quran-card p-6 sm:p-8">
          <div className="text-center">
            <p className="arabic-text text-center text-3xl text-[var(--primary)]">
              السَّلَامُ عَلَيْكُمْ
            </p>

            <h1 className="mt-4 text-3xl font-semibold">
              {t("Welcome to My Qur’an Journey")}{" "}</h1>

            <p className="mt-3 text-[var(--muted)]">
              {t("Set up your personal reading preferences before you begin.")}{" "}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium"
              >
                {t("What should we call you?")}{" "}</label>

              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("Fatima")}
                className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label
                htmlFor="interfaceLanguage"
                className="mb-2 block text-sm font-medium"
              >
                {t("Language")}{" "}</label>

              <select
                id="interfaceLanguage"
                value={interfaceLanguage}
                disabled={changingLanguage}
                onChange={(e) => void changeLanguage(e.target.value === "arabic" ? "ar" : "en")}
                className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4"
              >
                <option value="english">{t("English")}</option>
                <option value="arabic">العربية</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="quranDisplay"
                className="mb-2 block text-sm font-medium"
              >
                {t("Qur’an display preference")}{" "}</label>

              <select
                id="quranDisplay"
                value={quranDisplay}
                onChange={(e) => setQuranDisplay(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4"
              >
                <option value="arabic">{t("Arabic only")}</option>
                <option value="arabic_english">{t("Arabic + English")}</option>
                <option value="arabic_tagalog">{t("Arabic + Tagalog")}</option>
              </select>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {t(error || "")}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="quran-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t("Saving...") : t("Start My Journey")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}


