import type { CSSProperties } from "react";
import type { ResumeStyle } from "@/lib/types/resume";

export const RESUME_FONTS = ["Arial", "Helvetica", "Georgia", "Times New Roman", "Verdana"] as const;
export const RESUME_COLORS = ["#111111", "#333333", "#173e50", "#243b64", "#304b3b", "#553348"] as const;
export const DEFAULT_RESUME_STYLE: ResumeStyle = {
  fontFamily: "Arial", fontSize: 10.5, textColor: "#111111", accentColor: "#111111",
};

/** Treat saved styling as untrusted data; only supported, readable values reach CSS. */
export function normalizeResumeStyle(style?: Partial<ResumeStyle>): ResumeStyle {
  const fontFamily = RESUME_FONTS.find((font) => font === style?.fontFamily) ?? DEFAULT_RESUME_STYLE.fontFamily;
  const color = (value?: string) => RESUME_COLORS.find((entry) => typeof value === "string" && entry === value.toLowerCase()) ?? "#111111";
  return {
    fontFamily,
    fontSize: typeof style?.fontSize === "number" && Number.isFinite(style.fontSize)
      ? Math.min(12, Math.max(9, style.fontSize)) : DEFAULT_RESUME_STYLE.fontSize,
    textColor: color(style?.textColor), accentColor: color(style?.accentColor),
  };
}

export function resumeStyleVariables(style?: ResumeStyle): CSSProperties | undefined {
  if (!style) return undefined; // Preserve each legacy template's exact typography.
  const safe = normalizeResumeStyle(style);
  return {
    "--resume-font": `"${safe.fontFamily}", ${safe.fontFamily === "Georgia" || safe.fontFamily === "Times New Roman" ? "serif" : "sans-serif"}`,
    "--resume-size": `${safe.fontSize}pt`,
    "--resume-text": safe.textColor,
    "--resume-accent": safe.accentColor,
  } as CSSProperties;
}
