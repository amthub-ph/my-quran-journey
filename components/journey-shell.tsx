import Link from "next/link";
export function JourneyShell({title, children}: {title:string; children:React.ReactNode}) {
  return <main className="min-h-screen"><header className="border-b border-[var(--border)] bg-white"><div className="quran-container py-4 flex flex-wrap justify-between gap-4"><Link href="/protected" className="font-semibold">My Qur’an Journey</Link><nav aria-label="Main navigation" className="flex flex-wrap gap-4 text-sm"><Link href="/quran">Qur’an</Link><Link href="/progress">Progress</Link><Link href="/reflections">Reflections</Link><Link href="/reminders">Reminders</Link><Link href="/protected">Dashboard</Link></nav></div></header><section className="quran-container py-8"><h1 className="text-3xl font-semibold mb-6">{title}</h1>{children}</section></main>;
}
