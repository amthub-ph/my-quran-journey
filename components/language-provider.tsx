"use client";
import { createContext,useContext,useEffect,useMemo,useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveInterfaceLanguage } from "@/app/actions/language";
import { translator,type Locale } from "@/lib/i18n";
type LanguageState={language:Locale;t:(text:string)=>string;changeLanguage:(language:Locale)=>Promise<void>;busy:boolean;message:string};
const LanguageContext=createContext<LanguageState>({language:"en",t:translator("en"),changeLanguage:async()=>{},busy:false,message:""});
export function LanguageProvider({initialLanguage,children}:{initialLanguage:Locale;children:React.ReactNode}){
  const [language,setLanguage]=useState(initialLanguage),[saving,setSaving]=useState(false),[pending,startTransition]=useTransition(),[message,setMessage]=useState("");const router=useRouter();
  const t=useMemo(()=>translator(language),[language]);
  useEffect(()=>setLanguage(initialLanguage),[initialLanguage]);
  useEffect(()=>{document.documentElement.lang=language;document.documentElement.dir=language==="ar"?"rtl":"ltr";},[language]);
  async function changeLanguage(next:Locale){if(saving||pending||next===language)return;setSaving(true);setMessage("");try{const result=await saveInterfaceLanguage(next);if(result.error){setMessage("Could not save language. Please try again.");return;}setLanguage(next);setMessage(result.profileSaved?"Language saved.":"Language changed on this device. Complete your profile to save it to your account.");startTransition(()=>router.refresh());}catch{setMessage("Could not save language. Please try again.");}finally{setSaving(false);}}
  return <LanguageContext.Provider value={{language,t,changeLanguage,busy:saving||pending,message}}>{children}</LanguageContext.Provider>;
}
export function useI18n(){return useContext(LanguageContext);}
export function LanguageSwitcher(){const {language,t,changeLanguage,busy,message}=useI18n();return <div className="border-b border-[var(--border)] bg-[var(--background)]"><div className="quran-container flex flex-wrap items-center justify-end gap-3 py-2"><label className="flex items-center gap-2 text-sm" htmlFor="site-language">{t("Interface language")}<select id="site-language" className="journey-input !w-auto" value={language} disabled={busy} onChange={e=>void changeLanguage(e.target.value as Locale)}><option value="en" lang="en">English</option><option value="ar" lang="ar">العربية</option></select></label><span className="text-sm" role="status">{busy?t("Saving..."):t(message)}</span></div></div>;}
