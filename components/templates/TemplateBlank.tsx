"use client";

import type { TemplateProps } from "@/lib/types/resume";
import ResumeLayout from "./ResumeLayout";

export default function TemplateBlank(props: TemplateProps) {
  return <ResumeLayout {...props} variant="blank" />;
}
