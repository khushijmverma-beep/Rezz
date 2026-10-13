export type TemplateId = "blank" | "modern" | "professional" | "simple";

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
}
export interface Education {
  id: string;
  school: string;
  degree: string;
  dates: string;
  details: string;
}
export interface Project {
  id: string;
  name: string;
  url: string;
  description: string;
}
/** Presentation data only; account and persistence metadata belong to the caller. */
export interface ResumeData extends Record<string, unknown> {
  name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  awards: string[];
}
export interface TemplateProps {
  data: ResumeData;
  editable?: boolean;
  onChange?: (data: ResumeData) => void;
}
