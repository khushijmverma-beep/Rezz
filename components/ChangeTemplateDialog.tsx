"use client";

import { useEffect, useState } from "react";
import ResumeThumbnail from "@/components/templates/ResumeThumbnail";
import { TEMPLATES } from "@/lib/templates";
import type { ResumeData, TemplateId } from "@/lib/types/resume";

type ChangeTemplateDialogProps = {
  currentTemplateId: string;
  data: ResumeData;
  onClose: () => void;
  onChange: (templateId: TemplateId) => void;
};

// Mount only while open, so the selection starts at the current template each time.
export default function ChangeTemplateDialog({
  currentTemplateId,
  data,
  onClose,
  onChange,
}: ChangeTemplateDialogProps) {
  const [selected, setSelected] = useState(currentTemplateId);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-template-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4 sm:px-8 sm:pt-8">
          <div>
            <h2
              id="change-template-title"
              className="text-2xl font-semibold text-gray-900"
            >
              Change template
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your content and styling stay the same. Only the layout changes.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3">
            {TEMPLATES.map((template) => {
              const isSelected = selected === template.id;
              const isCurrent = currentTemplateId === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(template.id)}
                  className={`min-w-0 rounded-lg p-2 text-left ${
                    isSelected
                      ? "bg-gray-100 ring-2 ring-black"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="overflow-hidden rounded border border-gray-200 bg-white">
                    <ResumeThumbnail templateId={template.id} data={data} />
                  </div>

                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-800">
                      {template.label}
                    </span>
                    {isCurrent && (
                      <span className="rounded bg-black px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Current
                      </span>
                    )}
                    {template.atsFriendly && (
                      <span
                        title={template.atsNote}
                        className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-800"
                      >
                        ATS-friendly
                      </span>
                    )}
                  </span>

                  {template.atsNote && (
                    <span className="mt-1 block text-xs text-gray-500">
                      {template.atsNote}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-4 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={selected === currentTemplateId}
            onClick={() => onChange(selected as TemplateId)}
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Change
          </button>
        </div>
      </div>
    </div>
  );
}
