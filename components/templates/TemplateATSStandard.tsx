"use client";

import type { TemplateProps } from "./types";
import ResumeLayout from "./ResumeLayout";

export default function TemplateATSStandard(props: TemplateProps) {
  return <ResumeLayout {...props} variant="ats-standard" />;
}
