"use client";

import { useState } from "react";
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

  if (!sanitized || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(sanitized)) {
    return "resume";
  }
  return sanitized;
}

export default function DownloadMenu({
  title,
  data,
  downloadPdf,
}: DownloadMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
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
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setIsOpen(false);
  }

  function downloadPdfFile() {
    try {
      downloadPdf(title);
      setError("");
      setIsOpen(false);
    } catch (downloadError) {
      console.error("Could not download resume as PDF:", downloadError);
      setError("Couldn't prepare the PDF. Please try again.");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Download
      </button>
      {error && (
        <p role="alert" className="absolute right-0 mt-2 w-56 text-xs text-red-600">
          {error}
        </p>
      )}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={downloadPdfFile}
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
