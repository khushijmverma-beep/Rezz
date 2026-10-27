"use client";

import type { ResumeStyle } from "@/lib/types/resume";
import { DEFAULT_RESUME_STYLE, normalizeResumeStyle, RESUME_COLORS, RESUME_FONTS } from "./templates/resumeStyle";
import styles from "./templates/styleToolbar.module.css";

export type StyleToolbarProps = {
  style?: ResumeStyle;
  onChange: (style: ResumeStyle) => void;
};

/** Controlled toolbar: the editor applies the callback to data.style and persists the draft. */
export function StyleToolbar({ style, onChange }: StyleToolbarProps) {
  const value = normalizeResumeStyle(style);
  const update = (patch: Partial<ResumeStyle>) => onChange(normalizeResumeStyle({ ...value, ...patch }));
  return (
    <div className={styles.toolbar} role="group" aria-label="Resume text styling">
      <label>Font
        <select value={value.fontFamily} onChange={(event) => update({ fontFamily: event.target.value })}>
          {RESUME_FONTS.map((font) => <option key={font}>{font}</option>)}
        </select>
      </label>
      <label>Size (pt)
        <input type="number" min={9} max={12} step={0.5} value={value.fontSize}
          onChange={(event) => { if (event.target.value !== "") update({ fontSize: event.target.valueAsNumber }); }} />
      </label>
      {(["textColor", "accentColor"] as const).map((key) => (
        <fieldset key={key} className={styles.palette}>
          <legend>{key === "textColor" ? "Text color" : "Accent color"}</legend>
          {RESUME_COLORS.map((color) => (
            <button key={color} type="button" className={styles.swatch}
              style={{ backgroundColor: color }} aria-label={`${key === "textColor" ? "Text" : "Accent"} ${color}`}
              title={color} aria-pressed={value[key] === color} onClick={() => update({ [key]: color })}>
              {value[key] === color ? "✓" : ""}
            </button>
          ))}
        </fieldset>
      ))}
      <button type="button" className={styles.reset} onClick={() => onChange({ ...DEFAULT_RESUME_STYLE })}>Reset</button>
    </div>
  );
}

export default StyleToolbar;
