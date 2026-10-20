"use client";

import type { TemplateProps } from "./types";
import ResumeLayout from "./ResumeLayout";

export default function TemplateBold(props: TemplateProps) {
  return <ResumeLayout {...props} variant="bold" />;
}
