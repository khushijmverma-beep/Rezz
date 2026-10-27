export type TemplateId = "blank" | "modern" | "professional" | "simple" | "classic" | "bold" | "compact" | "engineer" | "ats-standard";

export type ExperienceItem = {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
};

export type EducationItem = {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
};

export type ProjectItem = {
  name: string;
  link: string;
  description: string;
};

export type ResumeStyle = {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  accentColor: string;
};

export type ResumeData = {
  style?: ResumeStyle;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  awards: string[];
  certifications?: string[];
  languages?: string[];
};

export const emptyResumeData: ResumeData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  website: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  awards: [],
  certifications: [],
  languages: [],
};
