import type { ComponentType } from "react";
import type { TemplateProps } from "@/components/templates/types";
import { sampleResume as baseSampleResume } from "@/lib/sampleResume";
import type { TemplateId } from "@/lib/types/resume";
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
export const sampleResume = {
  ...baseSampleResume,
  experience: baseSampleResume.experience.slice(0, 1),
  awards: [],
  summary: "Software developer building accessible web applications with React, TypeScript, and Python. Experienced in dashboards, automated tests, and reusable interfaces.",
  projects: baseSampleResume.projects.map((project) => ({ ...project, description: "Built a searchable event calendar with responsive views to help student groups coordinate volunteers." })),
  certifications: ["AWS Certified Cloud Practitioner"],
  languages: ["English", "Spanish"],
};
