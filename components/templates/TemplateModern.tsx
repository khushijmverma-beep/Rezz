"use client";

import type { TemplateProps } from "./types";
import ResumeLayout from "./ResumeLayout";

export default function TemplateModern(props: TemplateProps) {
  return <ResumeLayout {...props} variant="modern" />;
}
