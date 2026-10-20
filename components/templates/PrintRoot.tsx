"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getTemplate } from "@/lib/templates";
import type { ResumeData, TemplateId } from "@/lib/types/resume";

/** Mount once in the editor with its current (including unsaved) data. */
export function PrintRoot({ templateId, data }: { templateId: TemplateId; data: ResumeData }) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const Template = (getTemplate(templateId) ?? getTemplate("blank"))!.Component;

  useEffect(() => {
    const element = document.createElement("div");
    element.id = "print-root";
    document.body.appendChild(element);
    // The portal destination must be created after hydration, then rendered once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoot(element);
    return () => element.remove();
  }, []);

  return root ? createPortal(<Template data={data} />, root) : null;
}

export default PrintRoot;
