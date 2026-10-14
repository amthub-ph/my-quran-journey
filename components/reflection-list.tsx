"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { parseVerseKey } from "@/lib/quran";
import { saveReflection, deleteReflection, updateReflection } from "@/app/actions/journey";
export function ReflectionList({
  reflections,
  verseKey,
}: {
  reflections: {
    id: string;
    verse_key: string | null;
    content: string;
    created_at: string;
    updated_at: string;
  }[];
    verseKey?: string;
}) {
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
const [editContent, setEditContent] = useState("");
const router = useRouter();
  return (
    <div className="space-y-6">
      <section className="quran-card p-5 sm:p-6">
        <h2 className="text-xl font-semibold mb-2">
          Write a Reflection
        </h2>

        <p className="text-sm text-[var(--muted)] mb-4">
          Write your thoughts, lessons, reminders, or understanding from your
          Qur'an reading.
        </p>
{verseKey && (() => {
  const { ayah, chapter } = parseVerseKey(verseKey);

  return (
    <p className="mb-3 text-sm font-medium">
      Reflecting on {chapter.name_simple} · Ayah {ayah}
    </p>
  );
})()}
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What did you learn or reflect on today?"
          rows={7}
          className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-base resize-y"
        />

        <div className="mt-4 flex items-center justify-between gap-3">
            {verseKey ? (
  <Link
    href={`/quran/${verseKey.split(":")[0]}?ayah=${verseKey.split(":")[1]}`}
    className="text-sm font-medium text-green-700 transition hover:text-green-800"
  >
    ← Back to Ayah
  </Link>
) : (
  <span />
)}
          <button
            type="button"
          onClick={async () => {
  const result = await saveReflection(content, verseKey);

  if (result.error) {
    alert(result.error);
    return;
  }

  setContent("");
  router.refresh();
}}
            className="rounded-lg bg-green-700 px-5 py-2.5 font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!content.trim()}
          >
            Save Reflection
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          My Notes
        </h2>

        {reflections.length === 0 ? (
  <p className="text-sm text-[var(--muted)]">
    No reflections yet. Write your first reflection above.
  </p>
) : (
  <div className="space-y-3">
    {reflections.map((reflection) => (
      <article
        key={reflection.id}
       className="quran-card rounded-2xl border border-[var(--border)] px-5 py-4 shadow-sm"
      >
       <div className="flex flex-wrap items-start justify-between gap-2">
        {reflection.verse_key && (() => {
  const { ayah, chapter } = parseVerseKey(reflection.verse_key);

  return (
    <Link
  href={`/quran/${chapter.id}?ayah=${ayah}`}
  className="mb-2 inline-block text-sm font-semibold text-green-600/70 transition hover:text-green-700"
>
  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-600/70">
  <BookOpen size={16} strokeWidth={1.8} />
</span>
  {chapter.name_simple} · Ayah {ayah}
</Link>
  );
})()}
<p className="text-xs text-[var(--muted)]">
  {new Date(reflection.created_at).toLocaleString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})}
</p>
</div>
        {editingId === reflection.id ? (
 <div>
  <textarea
    value={editContent}
    onChange={(event) => setEditContent(event.target.value)}
    rows={6}
    className="w-full rounded-xl border border-[var(--border)] bg-white p-4 text-base resize-y"
  />
  <button
  type="button"
  onClick={async () => {
    const result = await updateReflection(reflection.id, editContent);

    if (result.error) {
      alert(result.error);
      return;
    }

    setEditingId(null);
    setEditContent("");
    router.refresh();
  }}
  disabled={!editContent.trim()}
  className="mt-3 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
>
  Save Changes
</button>
<button
  type="button"
  onClick={() => {
    setEditingId(null);
    setEditContent("");
  }}
  className="mt-3 ml-3 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-gray-50"
>
  Cancel
</button>
</div>
) : (
  <p className="mt-4 whitespace-pre-wrap">
    {reflection.content}
  </p>
)}

    
        <button
  type="button"
  onClick={() => {
    setEditingId(reflection.id);
    setEditContent(reflection.content);
  }}
 className="mt-4 mr-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-green-700"
>
  <Pencil size={18} strokeWidth={1.8} />
  Edit
</button>
        <button
  type="button"
  onClick={async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reflection?"
    );

    if (!confirmed) return;

    const result = await deleteReflection(reflection.id);

    if (result.error) {
      alert(result.error);
      return;
    }

    window.location.reload();
  }}
  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-red-600"
>
  <Trash2 size={18} strokeWidth={1.8} />
  Delete
</button>
      </article>
    ))}
  </div>
)}
      </section>
    </div>
  );
}