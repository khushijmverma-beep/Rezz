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

export const templates: { id: TemplateId; name: string; Component: ComponentType<TemplateProps> }[] = [
  { id: "blank", name: "Blank resume", Component: TemplateBlank },
  { id: "modern", name: "Modern", Component: TemplateModern },
  { id: "professional", name: "Professional", Component: TemplateProfessional },
  { id: "simple", name: "Simple", Component: TemplateSimple },
  { id: "classic", name: "Classic", Component: TemplateClassic },
  { id: "bold", name: "Bold", Component: TemplateBold },
  { id: "compact", name: "Compact", Component: TemplateCompact },
];
/** Unknown IDs deliberately return undefined so callers can choose a fallback or 404. */
export const getTemplate = (id: string) => templates.find((template) => template.id === id);

/** Shared choices for Home and the new-resume modal. */
export const TEMPLATES = templates.map(({ id, name }) => ({ id, label: name }));
export const sampleResume = {
  ...baseSampleResume,
  certifications: ["AWS Certified Cloud Practitioner"],
  languages: ["English", "Spanish"],
};
