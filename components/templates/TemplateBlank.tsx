"use client";

import type { TemplateProps } from "./types";
import ResumeLayout from "./ResumeLayout";

export default function TemplateBlank(props: TemplateProps) {
  return <ResumeLayout {...props} variant="blank" />;
}
