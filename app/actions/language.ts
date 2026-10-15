"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGE_COOKIE, type Locale } from "@/lib/i18n";
export async function saveInterfaceLanguage(language: Locale) {
  if(language!=="ar"&&language!=="en")return {error:true};
  let profileSaved=false;
  try {
    if(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY){
      const db=await createClient();const {data:{user},error:authError}=await db.auth.getUser();
      if(authError && authError.name!=="AuthSessionMissingError")return {error:true};
      if(user){const {data,error}=await db.from("profiles").update({interface_language:language==="ar"?"arabic":"english"}).eq("id",user.id).select("id");if(error)return {error:true};profileSaved=!!data?.length;}
    }
    (await cookies()).set(LANGUAGE_COOKIE,language,{path:"/",maxAge:31536000,sameSite:"lax",httpOnly:true,secure:process.env.NODE_ENV==="production" && process.env.VERCEL_ENV!==undefined});
    revalidatePath("/","layout");return {success:true,profileSaved};
  } catch {return {error:true};}
}
