"use client";

import ResumeThumbnail from "@/components/templates/ResumeThumbnail";
import { sampleResume } from "@/lib/templates";
import type { TemplateId } from "@/lib/types/resume";

type TemplateCardProps = {
  name: string;
  templateId: TemplateId;
  atsFriendly?: boolean;
  atsNote?: string;
  onClick: () => void;
};

export default function TemplateCard({
  name,
  templateId,
  atsFriendly,
  atsNote,
  onClick,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-40 shrink-0 text-left"
    >
      <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white transition group-hover:border-gray-400 group-hover:shadow-md">
        <ResumeThumbnail templateId={templateId} data={sampleResume} />

        {atsFriendly && (
          <span
            title={atsNote}
            className="absolute bottom-1.5 left-1.5 rounded border border-gray-300 bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-800"
          >
            ATS-friendly
          </span>
        )}
      </div>

      <p className="mt-2 text-sm font-medium text-gray-800 group-hover:text-black">
        {name}
      </p>
    </button>
  );
}
