import { getI18n } from "@/lib/i18n/server";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const { t } = await getI18n();

  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4">
      {t("Hey,")} {user.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button
        asChild
        size="sm"
        variant="outline"
        className="border-[var(--primary)] bg-white text-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
      >
        <Link href="/auth/login">
          {t("Sign in")}
        </Link>
      </Button>

      <Button
        asChild
        size="sm"
        className="bg-[var(--primary)] text-white hover:bg-[#264A3D]"
      >
        <Link href="/auth/sign-up">
          {t("Sign up")}
        </Link>
      </Button>
    </div>
  );
}