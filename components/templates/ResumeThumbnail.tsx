"use client";

import { useEffect, useRef, useState } from "react";
import { getTemplate } from "@/lib/templates";
import type { ResumeData, TemplateId } from "@/lib/types/resume";
import styles from "./templates.module.css";

export function ResumeThumbnail({ templateId, data }: { templateId: TemplateId; data: ResumeData }) {
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const Template = (getTemplate(templateId) ?? getTemplate("blank"))!.Component;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 816));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className={styles.thumbnail} aria-hidden="true">
      <div className={styles.thumbnailPaper} style={{ transform: `scale(${scale})` }}>
        <Template data={data} />
      </div>
    </div>
  );
}

export default ResumeThumbnail;
