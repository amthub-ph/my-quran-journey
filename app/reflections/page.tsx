import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JourneyShell } from "@/components/journey-shell";
import { ReflectionList } from "@/components/reflection-list";
export default async function ReflectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ verse?: string }>;
}) {
  const { verse } = await searchParams;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) redirect("/auth/login");
  const { data: reflections } = await db
  .from("journey_reflections")
  .select("id, verse_key, content, created_at, updated_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

  return (
    <JourneyShell title="My Reflections">
      <section className="quran-card p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">My Qur'an Reflections</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            A private space for your thoughts, lessons, and understanding while
            reading the Qur'an.
          </p>
        </div>

    <ReflectionList reflections={reflections || []} verseKey={verse} />
      </section>
    </JourneyShell>
  );
}