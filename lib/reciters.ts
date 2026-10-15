// Al Quran Cloud edition IDs and EveryAyah's published recitation directory.
export const reciters = [
  { id: "ar.alafasy", en: "Mishary Rashid Alafasy", ar: "مشاري راشد العفاسي" },
  { id: "ar.abdulsamad", en: "Abdul Basit Abdus Samad", ar: "عبد الباسط عبد الصمد" },
  { id: "ar.husary", en: "Mahmoud Khalil Al-Husary", ar: "محمود خليل الحصري" },
  { id: "ar.abdurrahmaansudais", en: "Abdul Rahman Al-Sudais", ar: "عبد الرحمن السديس" },
  { id: "ar.mahermuaiqly", en: "Maher Al-Muaiqly", ar: "ماهر المعيقلي" },
  { id: "Yasser_Ad-Dussary_128kbps", en: "Yasser Al-Dosari", ar: "ياسر الدوسري" },
] as const;
export type ReciterId = typeof reciters[number]["id"];
export function isReciterId(value: unknown): value is ReciterId {
  return reciters.some(reciter => reciter.id === value);
}
