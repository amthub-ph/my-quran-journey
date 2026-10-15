"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { paginateAyahs, type ReadingPage, type ReadingVerse, type ReadingLanguage } from "@/lib/reading-layout";
import { useI18n } from "./language-provider";

export function BookPage({ verses, language, fontSize, ayah, busy, onNavigate, onLastPage, onPageChange, activeAyah }: {
  activeAyah?: string | null; verses: ReadingVerse[]; language: ReadingLanguage; fontSize: number; ayah: number; busy: boolean;
  onNavigate: (ayah: number) => void; onLastPage: (last: boolean) => void; onPageChange: (page: ReadingPage | null) => void;
}) {
  const { t, language: uiLanguage } = useI18n();
  const measure = useRef<HTMLDivElement>(null), size = useRef<HTMLDivElement>(null), paper = useRef<HTMLElement>(null);
  const [pages, setPages] = useState<ReadingPage[]>([]), [height, setHeight] = useState(400), [ready, setReady] = useState(false);
  const pageIndex = Math.max(0, pages.findIndex(page => ayah >= page.start && ayah <= page.end));
  const page = pages[pageIndex];
  const numeral = (value: number) => value.toLocaleString(uiLanguage === "ar" ? "ar" : "en");
  useLayoutEffect(() => {
    let cancelled = false, frame = 0;
    setReady(false);
    const calculate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (cancelled || !measure.current || !size.current) return;
        const available = size.current.getBoundingClientRect().height;
        const heights = Array.from(measure.current.children).map(node => node.getBoundingClientRect().height);
        if (available <= 0 || heights.some(value => value <= 0)) return;
        const next = paginateAyahs(heights, available);
        setPages(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
        setHeight(available); setReady(true);
      });
    };
    const observer = new ResizeObserver(calculate);
    if (measure.current) observer.observe(measure.current);
    if (size.current) observer.observe(size.current);
    window.addEventListener("resize", calculate);
    document.fonts.addEventListener("loadingdone", calculate);
    void document.fonts.ready.then(() => { if (!cancelled) calculate(); });
    calculate();
    return () => { cancelled = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", calculate); document.fonts.removeEventListener("loadingdone", calculate); };
  }, [verses, fontSize, language, uiLanguage]);
  useEffect(() => { onLastPage(ready && !!page && page.end === verses.length); }, [ready, page, verses.length, onLastPage]);
  useEffect(() => { onPageChange(ready ? page ?? null : null); }, [ready, page, onPageChange]);
  const textLanguage = language === "arabic" ? "ar" : language === "english" ? "en" : "tl";
  function turn(next: number) {
    onNavigate(next);
    // Page turns bring the new page into view; selecting an ayah does not move the viewport.
    requestAnimationFrame(() => paper.current?.scrollIntoView({ block: "start", behavior: "instant" }));
  }
  return <div className="space-y-4">
    <article ref={paper} className="reader-paper" aria-label={t("Book view")} aria-busy={!ready}>
      <header className="reader-paper-heading" aria-live="polite">
        {ready && page ? <><span>{t("Page")} {numeral(pageIndex + 1)} {t("of")} {numeral(pages.length)}</span><span>{t("Ayahs")} <bdi>{numeral(page.start)}–{numeral(page.end)}</bdi></span></> : <span>{t("Preparing page…")}</span>}
      </header>
      <div className="reader-page-area" style={{ minHeight: height }}>
        <div ref={size} className="reader-height-guide" aria-hidden="true" />
        <div ref={measure} className={`reader-measure reader-page-text ${language === "arabic" ? "arabic-text" : ""}`} style={{ fontSize }} lang={textLanguage} dir={language === "arabic" ? "rtl" : "ltr"} aria-hidden="true" translate="no">
          {verses.map((verse, index) => <p key={verse.key} className="reader-ayah"><span>{verse.text}</span>{" "}<span className="reader-ayah-number">{numeral(index + 1)}</span></p>)}
        </div>
        {ready && page && <div className={`reader-page-text ${language === "arabic" ? "arabic-text" : ""}`} style={{ fontSize }} lang={textLanguage} dir={language === "arabic" ? "rtl" : "ltr"} translate="no">
          {verses.slice(page.start - 1, page.end).map((verse, index) => {
            const number = page.start + index;
            return <p key={verse.key} className="reader-ayah" data-playing={verse.key === activeAyah || undefined} aria-current={verse.key === activeAyah ? "true" : undefined}>
              <span>{verse.text}</span>{" "}<button type="button" className="reader-ayah-number" disabled={busy} aria-pressed={number === ayah}
                aria-label={`${t("Select ayah")} ${numeral(number)}`} onClick={() => onNavigate(number)}>{numeral(number)}</button>
            </p>;
          })}
        </div>}
      </div>
    </article>
    <nav className="flex items-center justify-between gap-3" aria-label={t("Page navigation")}>
      <button type="button" className="quran-btn-secondary" disabled={busy || !ready || pageIndex === 0} onClick={() => turn(pages[pageIndex - 1].start)}>
        <span aria-hidden="true">{uiLanguage === "ar" ? "→ " : "← "}</span>{t("Previous page")}
      </button>
      <button type="button" className="quran-btn-primary" disabled={busy || !ready || pageIndex >= pages.length - 1} onClick={() => turn(pages[pageIndex + 1].start)}>
        {t("Next page")}<span aria-hidden="true">{uiLanguage === "ar" ? " ←" : " →"}</span>
      </button>
    </nav>
    <p className="text-sm text-[var(--muted)]">{t("Pages adapt to your screen and text size. Long ayahs stay whole and may require scrolling.")}</p>
  </div>;
}
