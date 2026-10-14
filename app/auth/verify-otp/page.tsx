"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    window.location.href = "/onboarding";
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#FAF9F5] p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#B49350]">
            My Qur&apos;an Journey
          </p>

          <h1 className="mt-3 text-3xl font-semibold text-[#17372C]">
            Verify your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            We sent a verification code to
          </p>

          <p className="font-medium text-[#315C4B]">{email}</p>
        </div>

        <form onSubmit={verifyCode} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-medium text-[#17372C]"
            >
              Verification code
            </label>

            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit code"
              className="w-full rounded-xl border px-4 py-3 text-center text-xl tracking-[0.35em] outline-none focus:border-[#315C4B]"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full rounded-xl bg-[#315C4B] px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}