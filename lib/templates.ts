import type { ComponentType } from "react";
import type { TemplateProps } from "@/components/templates/types";
import type { ResumeData, TemplateId } from "@/lib/types/resume";
import TemplateBlank from "@/components/templates/TemplateBlank";
import TemplateModern from "@/components/templates/TemplateModern";
import TemplateProfessional from "@/components/templates/TemplateProfessional";
import TemplateSimple from "@/components/templates/TemplateSimple";

import TemplateClassic from "@/components/templates/TemplateClassic";
import TemplateBold from "@/components/templates/TemplateBold";
import TemplateCompact from "@/components/templates/TemplateCompact";

import TemplateEngineer from "@/components/templates/TemplateEngineer";
import TemplateATSStandard from "@/components/templates/TemplateATSStandard";

export const templates: { id: TemplateId; name: string; atsFriendly: boolean; atsNote: string; Component: ComponentType<TemplateProps> }[] = [
  { id: "blank", atsFriendly: true, atsNote: "Single column, plain headings, and text-only content.", name: "Blank resume", Component: TemplateBlank },
  { id: "modern", atsFriendly: false, atsNote: "Two columns and a shaded sidebar can disrupt reading order.", name: "Modern", Component: TemplateModern },
  { id: "professional", atsFriendly: true, atsNote: "Single column with standard headings and text-only contact details.", name: "Professional", Component: TemplateProfessional },
  { id: "simple", atsFriendly: true, atsNote: "Single column with plain section headings and no decorative boxes.", name: "Simple", Component: TemplateSimple },
  { id: "classic", atsFriendly: true, atsNote: "Single column, standard headings, and simple serif typography.", name: "Classic", Component: TemplateClassic },
  { id: "bold", atsFriendly: false, atsNote: "Decorative colored header and section accents.", name: "Bold", Component: TemplateBold },
  { id: "compact", atsFriendly: false, atsNote: "Two columns and a shaded sidebar can disrupt reading order.", name: "Compact", Component: TemplateCompact },
  { id: "engineer", name: "Engineer", atsFriendly: true, atsNote: "Single column, standard headings, text-only contacts, and right-aligned dates.", Component: TemplateEngineer },
  { id: "ats-standard", name: "ATS Standard", atsFriendly: true, atsNote: "Plain single column with standard headings and no images, icons, or colored boxes.", Component: TemplateATSStandard },
];
/** Unknown IDs deliberately return undefined so callers can choose a fallback or 404. */
export const getTemplate = (id: string) => templates.find((template) => template.id === id);

/** Shared choices for Home and the new-resume modal. */
export const TEMPLATES = templates.map(({ id, name, atsFriendly, atsNote }) => ({ id, label: name, atsFriendly, atsNote }));
/** Neutral, fictional content used only for unused-template previews. */
export const sampleResume: ResumeData = {
  firstName: "Your",
  lastName: "Name",
  email: "email@example.com",
  phone: "(555) 123-4567",
  location: "City, State",
  linkedin: "",
  github: "",
  website: "",
  summary: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  experience: [
    {
      title: "Lorem ipsum",
      company: "Dolor sit amet",
      location: "",
      startDate: "Month Year",
      endDate: "Month Year",
      bullets: ["Aenean ac interdum nisi."],
    },
    {
      title: "Consectetur adipiscing",
      company: "Elit aenean",
      location: "",
      startDate: "Month Year",
      endDate: "Month Year",
      bullets: ["Sed pulvinar lacinia felis."],
    },
  ],
  education: [{
    school: "Lorem ipsum dolor",
    degree: "Consectetur adipiscing elit",
    field: "",
    startDate: "",
    endDate: "",
    gpa: "",
  }],
  skills: ["Lorem ipsum", "Dolor sit amet", "Consectetur elit"],
  projects: [{
    name: "Lorem ipsum",
    link: "",
    description: "Aenean ac interdum nisi. Sed in consequat mi.",
  }],
  awards: ["Lorem ipsum dolor"],
  certifications: [],
  languages: ["Lorem ipsum", "Dolor sit amet"],
};
