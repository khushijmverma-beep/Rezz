"use client";

import type { TemplateProps } from "@/lib/types/resume";
import ResumeLayout from "./ResumeLayout";

export default function TemplateProfessional(props: TemplateProps) {
  return <ResumeLayout {...props} variant="professional" />;
}
