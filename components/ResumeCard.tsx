
"use client";

import Image from "next/image";

type ResumeCardProps = {
  name: string;
  updatedAt: string;
  resumeId: string;
  templateId: string;
  onDelete: (resumeId: string) => void;
};

export default function ResumeCard({
  name,
  updatedAt,
  resumeId,
  templateId,
  onDelete,
}: ResumeCardProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => {
          window.location.href = `/resume/${resumeId}`;
        }}
        className="w-full text-left"
      >
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="relative flex aspect-[8.5/5] items-center justify-center overflow-hidden bg-gray-100">
            {templateId === "blank" ? (
              <div className="flex h-full w-full items-center justify-center bg-gray-50">
                <span className="text-4xl font-light text-gray-300">
                  Resume
                </span>
              </div>
            ) : (
              <Image
                src={`/templates/${templateId}.png`}
                alt={`${name} thumbnail`}
                fill
                sizes="320px"
                className="object-cover object-top"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>

          <div className="p-4 pr-12">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {name}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Edited {updatedAt}
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        aria-label={`Delete ${name}`}
        title="Delete resume"
        onClick={() => onDelete(resumeId)}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl text-gray-600 shadow-sm hover:bg-gray-100"
      >
        ⋮
      </button>
    </div>
  );
}
