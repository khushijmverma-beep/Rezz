"use client";

import { useRef, useState } from "react";
import type { ResumeData } from "@/lib/types/resume";
import { resumeToText } from "@/lib/resumeToText";

type DownloadMenuProps = {
  title: string;
  data: ResumeData;
  downloadPdf: (title: string) => void;
};

function sanitizeFilename(title: string): string {
  const sanitized = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .trim()
    .replace(/[. ]+$/g, "");

  return sanitized || "resume";
}

export default function DownloadMenu({
  title,
  data,
  downloadPdf,
}: DownloadMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const filename = sanitizeFilename(title);

  function downloadText() {
    const blob = new Blob([resumeToText(data)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Download
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              downloadPdf(title);
              setIsOpen(false);
            }}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Download PDF
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={downloadText}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Download text
          </button>
        </div>
      )}
    </div>
  );
}
