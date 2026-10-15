"use client";

import { useI18n } from "@/components/language-provider";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (
    e: React.SubmitEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      window.location.href = "/protected";
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : t("An error occurred"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        className,
      )}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {t("Login")}
          </CardTitle>

          <CardDescription>
            {t(
              "Enter your email below to login to your account",
            )}{" "}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">
                  {t("Email")}
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">
                    {t("Password")}
                  </Label>

                  <Link
                    href="/auth/forgot-password"
                    className="ms-auto inline-block text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
                  >
                    {t(
                      "Forgot your password?",
                    )}{" "}
                  </Link>
                </div>

                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">
                  {t(error || "")}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--primary)] text-white hover:bg-[#264A3D] focus-visible:ring-[var(--primary)]"
              >
                {isLoading
                  ? t("Logging in...")
                  : t("Login")}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              {t(
                "Don't have an account?",
              )}{" "}

              <Link
                href="/auth/sign-up"
                className="font-semibold text-[var(--primary)] underline underline-offset-4 hover:opacity-80"
              >
                {t("Sign up")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}