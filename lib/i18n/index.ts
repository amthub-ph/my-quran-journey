import ar from "./ar.json";
export type Locale = "en" | "ar";
export const LANGUAGE_COOKIE = "journey-language";
export function normalizeLocale(value?: string | null): Locale | undefined {
  if(value === "ar" || value === "arabic") return "ar";
  if(value === "en" || value === "english") return "en";
}
export function resolveLocale(profile?: string | null, cookie?: string | null, acceptLanguage = ""): Locale {
  const saved = normalizeLocale(profile) || normalizeLocale(cookie);
  if (saved) return saved;
  const preferred = acceptLanguage.split(",").map((part,index)=>{const [tag,quality]=part.trim().split(";"); return {tag:tag.toLowerCase().split("-")[0],q:quality?.startsWith("q=")?Number(quality.slice(2)):1,index};}).filter(p=>p.q>0).sort((a,b)=>b.q-a.q||a.index-b.index)[0];
  return preferred?.tag === "ar" ? "ar" : "en";
}
export function translate(locale: Locale, text: string): string {
  if(locale !== "ar") return text;
  const key = text.replace(/\s+/g," ").trim();
  const direct = (ar as Record<string,string>)[key];
  if(direct) return direct;
  const patterns: [RegExp, (match:RegExpMatchArray)=>string][] = [
    [/^Progress automatically saved at Ayah (\d+)\.$/,m=>`تم حفظ التقدم تلقائيًا عند الآية ${m[1]}.`],
    [/^Paused at Ayah (\d+)\. You can continue from here later\.$/,m=>`تم حفظ موضع التوقف عند الآية ${m[1]}. يمكنك المتابعة من هنا لاحقًا.`],
    [/^Remove bookmark (.+)$/,m=>`إزالة العلامة المرجعية ${m[1]}`],
    [/^Could not (load|update|delete) reminder[s]?:.*$/,()=>"تعذر تحميل التذكير أو تحديثه. تحقق من الاتصال وحاول مجددًا."],
    [/^Reminder could not be saved:.*$/,()=>"تعذر حفظ التذكير. يرجى المحاولة مجددًا."],
    [/^Progress could not be saved:.*$/,()=>"تعذر حفظ التقدم. يرجى المحاولة مجددًا."],
    [/^Reflection could not be (saved|updated|deleted):.*$/,()=>"تعذر حفظ التدبر أو تحديثه. يرجى المحاولة مجددًا."],
    [/^Unable to (save|delete|update)( reflection)?\. Please sign in and try again\.$/,()=>"تعذر إتمام العملية. يرجى تسجيل الدخول والمحاولة مجددًا."],
    [/^Bookmark could not be saved.*$/,()=>"تعذر حفظ العلامة المرجعية. تحقق من الاتصال وحاول مجددًا."],
    [/^Please (write something before saving|sign in and try again)\.$/,()=>"يرجى تسجيل الدخول وكتابة ملاحظتك قبل الحفظ."],
    [/^Reflection cannot be empty\.$/,()=>"لا يمكن حفظ تدبر فارغ."],
    [/^Quran Foundation credentials.*$/,()=>"لم تُضبط بيانات اتصال مؤسسة القرآن بعد. يمكنك مواصلة قراءة النص العربي."],
    [/^Quran Foundation.*$/,()=>"خدمة الترجمة أو التلاوة غير متاحة حاليًا. يمكنك مواصلة قراءة النص العربي."],
    [/^Tagalog.*$/,()=>"الترجمة التاغالوغية غير متاحة حاليًا."],
  ];
  for(const [pattern,format] of patterns){const match=key.match(pattern);if(match)return format(match);}
  return text;
}
export function translator(locale:Locale) {return (text:string)=>translate(locale,text);}
export function normalizeSurahSearch(text:string){return text.toLowerCase().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[\u064b-\u065f\u0670\u0640]/g,"").replace(/[أإآٱ]/g,"ا").trim();}
