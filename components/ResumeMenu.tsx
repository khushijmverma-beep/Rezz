
"use client";

import { useEffect, useRef, useState } from "react";

type ResumeMenuProps = {
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDownloadPdf: () => void;
  onDownloadText: () => void;
  onDelete: () => void;
};

export default function ResumeMenu({
  onOpen,
  onRename,
  onDuplicate,
  onDownloadPdf,
  onDownloadText,
  onDelete,
}: ResumeMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const actions = [
    ["Open", onOpen],
    ["Rename", onRename],
    ["Duplicate", onDuplicate],
    ["Download PDF", onDownloadPdf],
    ["Download text (.txt)", onDownloadText],
    ["Delete", onDelete],
  ] as const;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Resume options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-600 hover:bg-gray-100"
      >
        ⋮
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-20 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          {actions.map(([label, action]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                action();
              }}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                label === "Delete" ? "text-red-600" : "text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

