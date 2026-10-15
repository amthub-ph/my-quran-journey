"use server";
import { createClient } from "@/lib/supabase/server";
import { parseVerseKey } from "@/lib/quran";
import { revalidatePath } from "next/cache";
async function session() {
  const db = await createClient();
  const {data:{user}} = await db.auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  return { db, user };
}
export async function savePosition(key: string) {
  try {
    const position = parseVerseKey(key);
    const { db, user } = await session();

    const { error } = await db.from("journey_progress").upsert(
      {
  user_id: user.id,
  surah: position.surah,
  ayah: position.ayah,
  verse_key: key,
  updated_at: new Date().toISOString(),
},
      {
        onConflict: "user_id,surah",
      }
    );

    if (error) {
  console.error("SAVE PROGRESS ERROR:", error);
  return {
    error: `Progress could not be saved: ${error.message}`,
  };
}

    revalidatePath("/protected");
    revalidatePath("/progress");

    return { success: true };
  } catch {
    return {
      error: "Unable to save. Please sign in and try again.",
    };
  }
}
export async function setBookmark(key:string, enabled:boolean) {
  try {
    parseVerseKey(key);
    const {db,user} = await session();
    const result = enabled ? await db.from("journey_bookmarks").upsert({user_id:user.id,verse_key:key}, {onConflict:"user_id,verse_key"}) : await db.from("journey_bookmarks").delete().eq("user_id",user.id).eq("verse_key",key);
    if(result.error) return {error:"Bookmark could not be saved. Check your connection and database setup."};
    revalidatePath("/bookmarks"); return {success:true};
  } catch {return {error:"Please sign in and try again."};}
}

export async function saveReflection(content: string, verseKey?: string) {
  try {
    if (!content.trim()) {
      return { error: "Please write something before saving." };
    }

    if (verseKey) {
      parseVerseKey(verseKey);
    }

    const { db, user } = await session();

    const { error } = await db.from("journey_reflections").insert({
      user_id: user.id,
      verse_key: verseKey || null,
      content: content.trim(),
    });

    if (error) {
      console.error("SAVE REFLECTION ERROR:", error);
      return {
        error: `Reflection could not be saved: ${error.message}`,
      };
    }

    revalidatePath("/reflections");
    revalidatePath("/protected");

    return { success: true };
  } catch {
    return {
      error: "Unable to save reflection. Please sign in and try again.",
    };
  }
}


export async function deleteReflection(id: string) {
  try {
    const { db, user } = await session();

    const { error } = await db
      .from("journey_reflections")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("DELETE REFLECTION ERROR:", error);
      return {
        error: `Reflection could not be deleted: ${error.message}`,
      };
    }

    revalidatePath("/reflections");
    revalidatePath("/protected");

    return { success: true };
  } catch {
    return {
      error: "Unable to delete reflection. Please sign in and try again.",
    };
  }
}

export async function updateReflection(id: string, content: string) {
  try {
    if (!content.trim()) {
      return { error: "Reflection cannot be empty." };
    }

    const { db, user } = await session();

    const { error } = await db
      .from("journey_reflections")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("UPDATE REFLECTION ERROR:", error);
      return {
        error: `Reflection could not be updated: ${error.message}`,
      };
    }

    revalidatePath("/reflections");
    revalidatePath("/protected");

    return { success: true };
  } catch {
    return {
      error: "Unable to update reflection. Please sign in and try again.",
    };
  }
}