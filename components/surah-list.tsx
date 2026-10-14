"use client";
import { useState } from "react";
import Link from "next/link";
import { chapters } from "@/lib/quran";
export function SurahList() {
  const [query,setQuery] = useState("");
  const list = chapters.filter(c => `${c.id} ${c.name_simple} ${c.name_arabic} ${c.translated_name.name}`.toLowerCase().includes(query.toLowerCase()));
  return <><label htmlFor="surah-search" className="block mb-2">Find a surah</label><input id="surah-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} className="journey-input mb-6" placeholder="Name or number, 1–114"/><p className="mb-4 text-sm" role="status">{list.length} surahs</p><div className="grid gap-3 sm:grid-cols-2">{list.map(c=><Link key={c.id} href={`/quran/${c.id}`} className="quran-card p-5 flex justify-between gap-4"><div><span className="text-sm text-[var(--muted)]">{c.id} · {c.verses_count} ayat</span><h2 className="font-semibold">{c.name_simple}</h2><p className="text-sm">{c.translated_name.name}</p></div><span lang="ar" dir="rtl" translate="no" className="arabic-text text-2xl text-[var(--primary)]">{c.name_arabic}</span></Link>)}</div></>;
}
