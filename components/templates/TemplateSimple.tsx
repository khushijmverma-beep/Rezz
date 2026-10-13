"use client";

import type { TemplateProps } from "@/lib/types/resume";
import ResumeLayout from "./ResumeLayout";

export default function TemplateSimple(props: TemplateProps) {
  return <ResumeLayout {...props} variant="simple" />;
}
