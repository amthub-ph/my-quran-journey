import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGE_COOKIE, resolveLocale, translator } from "./index";
export const getI18n = cache(async()=>{
  const cookie = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  let preference: string | undefined;
  if(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY){
    try {
      const db=await createClient();
      const {data:{user}}=await db.auth.getUser();
      if(user){const {data}=await db.from("profiles").select("interface_language").eq("id",user.id).maybeSingle();preference=data?.interface_language;}
    } catch { /* Retain the device preference while authentication is unavailable. */ }
  }
  const language=resolveLocale(preference,cookie,(await headers()).get("accept-language")||"");
  return {language,t:translator(language)};
});
