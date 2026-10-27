"use client";

import type { TemplateProps } from "./types";
import ResumeLayout from "./ResumeLayout";

export default function TemplateEngineer(props: TemplateProps) {
  return <ResumeLayout {...props} variant="engineer" />;
}
