"use client";

import { useEffect, useRef, useState } from "react";

type SectionNavProps = {
  sections: { id: string; label: string }[];
};

// A list of section links, like "Document tabs" in Google Docs. The section
// nearest the top of the screen is highlighted as you scroll.
export default function SectionNav({ sections }: SectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const highlightStartRef = useRef<number | null>(null);
  const highlightEndRef = useRef<number | null>(null);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        // first section (in page order) that is currently in view
        const first = sections.find((s) => visible.has(s.id));
        if (first) setActiveId(first.id);
      },
      // only the top part of the screen counts as "in view"
      { rootMargin: "-80px 0px -60% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(
    () => () => {
      if (highlightStartRef.current !== null) {
        window.clearTimeout(highlightStartRef.current);
      }
      if (highlightEndRef.current !== null) {
        window.clearTimeout(highlightEndRef.current);
      }
    },
    [],
  );

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    if (highlightStartRef.current !== null) {
      window.clearTimeout(highlightStartRef.current);
    }
    if (highlightEndRef.current !== null) {
      window.clearTimeout(highlightEndRef.current);
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setActiveId(id);
    highlightStartRef.current = window.setTimeout(() => {
      el.classList.remove("resume-section-flash");
      void el.offsetWidth;
      el.classList.add("resume-section-flash");
      highlightEndRef.current = window.setTimeout(() => {
        el.classList.remove("resume-section-flash");
        highlightEndRef.current = null;
      }, 500);
      highlightStartRef.current = null;
    }, 350);
  };

  return (
    <nav aria-label="Sections" className="rounded-lg border border-gray-300 bg-white p-3">
      <h2 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Sections
      </h2>
      <ul id="section-nav-list" className="mt-2 space-y-1">
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                aria-current={active ? "location" : undefined}
                className={`block rounded border-l-2 px-2 py-1 text-sm no-underline ${
                  active
                    ? "border-black bg-gray-100 font-semibold text-black"
                    : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
