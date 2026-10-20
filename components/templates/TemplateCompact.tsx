"use client";

import type { TemplateProps } from "./types";
import ResumeLayout from "./ResumeLayout";

export default function TemplateCompact(props: TemplateProps) {
  return <ResumeLayout {...props} variant="compact" />;
}
