"use client";

import type { TemplateProps } from "@/lib/types/resume";
import ResumeLayout from "./ResumeLayout";

export default function TemplateModern(props: TemplateProps) {
  return <ResumeLayout {...props} variant="modern" />;
}
