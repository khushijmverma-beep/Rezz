import type { ResumeData } from "@/lib/types/resume";

export type TemplateProps = {
  data: ResumeData;
  editable?: boolean;
  onChange?: (data: ResumeData) => void;
};
