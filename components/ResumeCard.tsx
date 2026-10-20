
"use client";

import Link from "next/link";
import ResumeMenu from "@/components/ResumeMenu";
import type { Draft } from "@/lib/drafts";

type ResumeCardProps = {
  draft: Draft;
  viewMode: "grid" | "list";
  dateLabel: string;
  onRename: (draft: Draft) => void;
  onDuplicate: (draft: Draft) => void;
  onDownloadText: (draft: Draft) => void;
  onDelete: (resumeId: string) => void;
};

export default function ResumeCard({
  draft,
  viewMode,
  dateLabel,
  onRename,
  onDuplicate,
  onDownloadText,
  onDelete,
}: ResumeCardProps) {
  const fullName = [
    draft.data.firstName,
    draft.data.lastName,
  ].filter(Boolean).join(" ") || "Your name";

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
          <div className="h-48 overflow-hidden rounded-t-xl bg-gray-50 p-5">
            <div className="mx-auto h-full max-w-sm overflow-hidden border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="truncate text-lg font-bold text-gray-800">
                {fullName}
              </h3>
              <p className="truncate text-xs text-gray-500">
                {draft.data.email}
              </p>
              {draft.data.summary && (
                <p className="mt-3 line-clamp-3 text-xs text-gray-600">
                  {draft.data.summary}
                </p>
              )}
              {draft.data.experience.slice(0, 2).map((item, index) => (
                <div key={`${item.company}-${index}`} className="mt-3">
                  <p className="truncate text-xs font-semibold text-gray-700">
                    {item.title || item.company}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {item.company}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={isList ? "min-w-0" : "p-4"}>
          <h3 className="truncate font-semibold text-gray-900">
            {draft.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
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
