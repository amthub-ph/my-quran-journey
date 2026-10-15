import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function QuranLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = await createClient();

  const {
    data: { user },
  } = await db.auth.getUser();

  // Signed-in users can access the Qur'an normally.
  if (user) {
    return children;
  }

  // Check whether the visitor explicitly chose guest mode.
  const cookieStore = await cookies();
  const guestAccess = cookieStore.get("quran_guest")?.value === "true";

  // If not signed in and not a guest, send them to the start page.
  if (!guestAccess) {
    redirect("/start");
  }

  // Guests can access the Qur'an reader.
  return children;
}