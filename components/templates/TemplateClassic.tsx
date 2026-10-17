"use client";

import type { TemplateProps } from "./types";
import ResumeLayout from "./ResumeLayout";

export default function TemplateClassic(props: TemplateProps) {
  return <ResumeLayout {...props} variant="classic" />;
}
