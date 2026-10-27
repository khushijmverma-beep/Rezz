"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import TemplateCard from "@/components/TemplateCard";
import { TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types/resume";

// Templates shown before the gallery is expanded. Blank is first in TEMPLATES.
const VISIBLE_COUNT = 6;

type TemplateRowProps = {
  onSelect: (templateId: TemplateId) => void;
};

export default function TemplateRow({ onSelect }: TemplateRowProps) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? TEMPLATES : TEMPLATES.slice(0, VISIBLE_COUNT);
  const hiddenCount = TEMPLATES.length - VISIBLE_COUNT;

  return (
    <>
      <div
        id="template-row"
        className={`mt-4 flex gap-5 pb-3 ${
          expanded ? "flex-wrap" : "overflow-x-auto"
        }`}
      >
        {shown.map((template) => (
          <TemplateCard
            key={template.id}
            name={template.label}
            templateId={template.id}
            atsFriendly={template.atsFriendly}
            atsNote={template.atsNote}
            onClick={() => onSelect(template.id)}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="template-row"
          className="mt-1 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Template gallery
          {expanded ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
        </button>
      )}
    </>
  );
}
