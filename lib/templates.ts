import type { ComponentType } from "react";
import type { TemplateId, TemplateProps } from "@/lib/types/resume";
import TemplateBlank from "@/components/templates/TemplateBlank";
import TemplateModern from "@/components/templates/TemplateModern";
import TemplateProfessional from "@/components/templates/TemplateProfessional";
import TemplateSimple from "@/components/templates/TemplateSimple";

export const templates: { id: TemplateId; name: string; Component: ComponentType<TemplateProps> }[] = [
  { id: "blank", name: "Blank resume", Component: TemplateBlank },
  { id: "modern", name: "Modern", Component: TemplateModern },
  { id: "professional", name: "Professional", Component: TemplateProfessional },
  { id: "simple", name: "Simple", Component: TemplateSimple },
];
/** Unknown IDs deliberately return undefined so callers can choose a fallback or 404. */
export const getTemplate = (id: string) => templates.find((template) => template.id === id);
