
"use client";

import Link from "next/link";
import ResumeMenu from "@/components/ResumeMenu";
import ResumeThumbnail from "@/components/templates/ResumeThumbnail";
import type { Draft } from "@/lib/drafts";
import type { TemplateId } from "@/lib/types/resume";

type ResumeCardProps = {
  draft: Draft;
  viewMode: "grid" | "list";
  dateLabel: string;
  dateKind?: "Created" | "Modified";
  onRename: (draft: Draft) => void;
  onDuplicate: (draft: Draft) => void;
  onDownloadText: (draft: Draft) => void;
  onDelete: (resumeId: string) => void;
};

export default function ResumeCard({
  draft,
  viewMode,
  dateLabel,
  dateKind,
  onRename,
  onDuplicate,
  onDownloadText,
  onDelete,
}: ResumeCardProps) {
  const isList = viewMode === "list";

  return (
    <article
      className={`relative rounded-xl border border-gray-200 bg-white ${
        isList ? "flex items-center gap-4 p-3" : "overflow-visible"
      }`}
    >
      <Link
        href={`/resume/${draft.id}`}
        className={isList ? "min-w-0 flex-1" : "block"}
      >
        {!isList && (
          <div className="overflow-hidden rounded-t-xl bg-gray-50">
            <ResumeThumbnail
              templateId={draft.templateId as TemplateId}
              data={draft.data}
            />
          </div>
        )}

        <div className={isList ? "min-w-0" : "p-4"}>
          <h3 className="truncate font-semibold text-gray-900">
            {draft.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isList && dateKind && (
              <span className="mr-1 text-xs font-medium">{dateKind}</span>
            )}
            {dateLabel}
          </p>
        </div>
      </Link>

      <div className={isList ? "shrink-0" : "absolute right-2 top-2"}>
        <ResumeMenu
          onOpen={() => { window.location.href = `/resume/${draft.id}`; }}
          onRename={() => onRename(draft)}
          onDuplicate={() => onDuplicate(draft)}
          onDownloadPdf={() => {
            window.location.href = `/resume/${draft.id}?download=pdf`;
          }}
          onDownloadText={() => onDownloadText(draft)}
          onDelete={() => onDelete(draft.id)}
        />
      </div>
    </article>
  );
}
