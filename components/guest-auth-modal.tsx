"use client";

import Link from "next/link";

type GuestAuthModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
};

export function GuestAuthModal({
  open,
  onClose,
  title = "Save Your Qur’an Journey",
  description = "Create an account or sign in to save your progress permanently and access this feature.",
}: GuestAuthModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-xl font-semibold text-[var(--primary)]">
            ق
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-[var(--muted)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
          >
            ×
          </button>
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/auth/sign-up"
            className="quran-btn-primary inline-flex w-full items-center justify-center"
          >
            Create Account
          </Link>

          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--primary)] bg-white px-4 py-3 text-sm font-semibold text-[var(--primary)] transition hover:bg-[var(--primary-soft)]"
          >
            Sign In
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            Continue Reading as Guest
          </button>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[var(--muted)]">
          Your Qur’an reading remains available in guest mode, but account
          features are saved permanently only after signing in.
        </p>
      </div>
    </div>
  );
}