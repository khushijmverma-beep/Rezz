"use client";

import type { TemplateProps } from "./types";
import ResumeLayout from "./ResumeLayout";

export default function TemplateProfessional(props: TemplateProps) {
  return <ResumeLayout {...props} variant="professional" />;
}
