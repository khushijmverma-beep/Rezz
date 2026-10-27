"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type SectionNavProps = {
  sections: { id: string; label: string }[];
};

// A list of section links, like "Document tabs" in Google Docs. The section
// nearest the top of the screen is highlighted as you scroll.
export default function SectionNav({ sections }: SectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [open, setOpen] = useState(true);

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

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <nav aria-label="Sections" className="rounded-lg border border-gray-300 bg-white p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="section-nav-list"
        className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-100"
      >
        Sections
        {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>

      {open && (
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
      )}
    </nav>
  );
}
