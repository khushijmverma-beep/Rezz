"use client";

import type { TemplateProps } from "./types";
import ResumeLayout from "./ResumeLayout";

export default function TemplateSimple(props: TemplateProps) {
  return <ResumeLayout {...props} variant="simple" />;
}
