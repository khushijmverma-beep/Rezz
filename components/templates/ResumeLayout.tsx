"use client";

import type { ReactNode } from "react";
import type {
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeData,
  TemplateId,
} from "@/lib/types/resume";
import { resumeStyleVariables } from "./resumeStyle";
import EditableText from "./EditableText";
import type { TemplateProps } from "./types";
import styles from "./templates.module.css";

const contactKeys = ["email", "phone", "location", "linkedin", "github", "website"] as const;

const contactLabels: Record<(typeof contactKeys)[number], string> = {
  email: "Email",
  phone: "Phone",
  location: "Location",
  linkedin: "LinkedIn",
  github: "GitHub",
  website: "Website",
};

function hasText(value: string) {
  return value.trim().length > 0;
}

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function listFromCommas(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function formatRange(startDate: string, endDate: string) {
  if (hasText(startDate) && hasText(endDate)) return `${startDate} - ${endDate}`;
  return hasText(startDate) ? startDate : endDate;
}

function degreeLine(degree: string, field: string) {
  if (hasText(degree) && hasText(field)) return `${degree} in ${field}`;
  return hasText(degree) ? degree : field;
}

function splitName(value: string) {
  const trimmed = value.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim(),
  };
}

function emptyExperience(): ExperienceItem {
  return { company: "", title: "", location: "", startDate: "", endDate: "", bullets: [] };
}

function emptyEducation(): EducationItem {
  return { school: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" };
}

function emptyProject(): ProjectItem {
  return { name: "", link: "", description: "" };
}

function hasExperience(item: ExperienceItem) {
  return (
    [item.company, item.title, item.location, item.startDate, item.endDate].some(hasText) ||
    item.bullets.some(hasText)
  );
}

function hasEducation(item: EducationItem) {
  return [item.school, item.degree, item.field, item.startDate, item.endDate, item.gpa].some(hasText);
}

function hasProject(item: ProjectItem) {
  return [item.name, item.link, item.description].some(hasText);
}

export default function ResumeLayout({
  data,
  editable = false,
  onChange,
  variant,
}: TemplateProps & { variant: TemplateId }) {
  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    onChange?.({ ...data, [key]: value });

  const field = (
    value: string,
    placeholder: string,
    commit: (value: string) => void,
    className = "",
    tag: "span" | "h1" | "p" = "p",
  ) =>
    editable || hasText(value) ? (
      <EditableText
        value={value}
        placeholder={placeholder}
        editable={editable}
        onCommit={commit}
        className={className}
        tag={tag}
      />
    ) : null;

  const section = (title: string, visible: boolean, children: ReactNode) =>
    (editable || visible) && (
      <section className={styles.section}>
        <h2>{title}</h2>
        {children}
      </section>
    );

  const remove = (label: string, action: () => void) =>
    editable && (
      <button type="button" className={styles.remove} aria-label={`Remove ${label}`} onClick={action}>
        ×
      </button>
    );

  const add = (label: string, action: () => void) =>
    editable && (
      <button type="button" className={styles.add} onClick={action}>
        + Add {label}
      </button>
    );

  const contact = (
    <div className={styles.contact}>
      {contactKeys.map((key) =>
        editable || hasText(data[key]) ? (
          <div key={key}>{field(data[key], contactLabels[key], (value) => update(key, value))}</div>
        ) : null,
      )}
    </div>
  );

  const fullName = [data.firstName, data.lastName].filter(hasText).join(" ");
  const name = field(
    fullName,
    "Your name",
    (value) => onChange?.({ ...data, ...splitName(value) }),
    styles.name,
    "h1",
  );

  const skills = section(
    "Skills",
    data.skills.some(hasText),
    field(data.skills.join(", "), "Skills, separated by commas", (value) =>
      update("skills", listFromCommas(value)),
    ),
  );

  const awards = section(
    "Awards",
    data.awards.some(hasText),
    field(data.awards.join(", "), "Awards, separated by commas", (value) =>
      update("awards", listFromCommas(value)),
    ),
  );

  const extraFields = (["certifications", "languages"] as const).map((key) => {
    const values = (data[key] ?? []).filter(hasText);
    return <div key={key}>{section(
      key === "certifications" ? "Certifications" : "Languages",
      values.length > 0,
      field(values.join(", "), `${key}, separated by commas`, (value) =>
        update(key, listFromCommas(value))),
    )}</div>;
  });

  const experience = section(
    "Experience",
    data.experience.some(hasExperience),
    <>
      {data.experience.map((item, index) =>
        editable || hasExperience(item) ? (
          <div className={styles.item} key={index}>
            {remove(`experience ${index + 1}`, () =>
              update(
                "experience",
                data.experience.filter((_, i) => i !== index),
              ),
            )}
            {field(
              item.title,
              "Job title",
              (value) =>
                update(
                  "experience",
                  data.experience.map((entry, i) => (i === index ? { ...entry, title: value } : entry)),
                ),
              styles.itemTitle,
            )}
            {field(item.company, "Company", (value) =>
              update(
                "experience",
                data.experience.map((entry, i) => (i === index ? { ...entry, company: value } : entry)),
              ),
              styles.organization,
            )}
            {field(item.location, "Job location", (value) =>
              update(
                "experience",
                data.experience.map((entry, i) => (i === index ? { ...entry, location: value } : entry)),
              ),
            )}
            {editable ? (
              <>
                {field(
                  item.startDate,
                  "Start date",
                  (value) =>
                    update(
                      "experience",
                      data.experience.map((entry, i) =>
                        i === index ? { ...entry, startDate: value } : entry,
                      ),
                    ),
                  styles.dateRange,
                )}
                {field(
                  item.endDate,
                  "End date",
                  (value) =>
                    update(
                      "experience",
                      data.experience.map((entry, i) =>
                        i === index ? { ...entry, endDate: value } : entry,
                      ),
                    ),
                  styles.dateRange,
                )}
              </>
            ) : (
              field(formatRange(item.startDate, item.endDate), "", () => undefined, styles.dateRange)
            )}
            {editable ? (
              field(item.bullets.join("\n"), "Achievements, one per line", (value) =>
                update(
                  "experience",
                  data.experience.map((entry, i) =>
                    i === index ? { ...entry, bullets: lines(value) } : entry,
                  ),
                ),
              )
            ) : (
              <ul>
                {item.bullets.filter(hasText).map((bullet, bulletIndex) => (
                  <li key={bulletIndex}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null,
      )}
      {editable && !data.experience.length && (
        <p className={styles.placeholder}>Job title · Company · Achievements</p>
      )}
      {add("experience", () => update("experience", [...data.experience, emptyExperience()]))}
    </>,
  );

  const education = section(
    "Education",
    data.education.some(hasEducation),
    <>
      {data.education.map((item, index) =>
        editable || hasEducation(item) ? (
          <div className={styles.item} key={index}>
            {remove(`education ${index + 1}`, () =>
              update(
                "education",
                data.education.filter((_, i) => i !== index),
              ),
            )}
            {editable ? (
              <>
                {field(
                  item.degree,
                  "Degree",
                  (value) =>
                    update(
                      "education",
                      data.education.map((entry, i) => (i === index ? { ...entry, degree: value } : entry)),
                    ),
                  styles.itemTitle,
                )}
                {field(item.field, "Field of study", (value) =>
                  update(
                    "education",
                    data.education.map((entry, i) => (i === index ? { ...entry, field: value } : entry)),
                  ),
                )}
              </>
            ) : (
              field(degreeLine(item.degree, item.field), "", () => undefined, styles.itemTitle)
            )}
            {field(item.school, "School", (value) =>
              update(
                "education",
                data.education.map((entry, i) => (i === index ? { ...entry, school: value } : entry)),
              ),
              styles.organization,
            )}
            {editable ? (
              <>
                {field(
                  item.startDate,
                  "Start date",
                  (value) =>
                    update(
                      "education",
                      data.education.map((entry, i) =>
                        i === index ? { ...entry, startDate: value } : entry,
                      ),
                    ),
                  styles.dateRange,
                )}
                {field(
                  item.endDate,
                  "End date",
                  (value) =>
                    update(
                      "education",
                      data.education.map((entry, i) =>
                        i === index ? { ...entry, endDate: value } : entry,
                      ),
                    ),
                  styles.dateRange,
                )}
              </>
            ) : (
              field(formatRange(item.startDate, item.endDate), "", () => undefined, styles.dateRange)
            )}
            {editable
              ? field(item.gpa, "GPA", (value) =>
                  update(
                    "education",
                    data.education.map((entry, i) => (i === index ? { ...entry, gpa: value } : entry)),
                  ),
                )
              : hasText(item.gpa)
                ? field(`GPA: ${item.gpa}`, "", () => undefined)
                : null}
          </div>
        ) : null,
      )}
      {editable && !data.education.length && <p className={styles.placeholder}>School · Degree</p>}
      {add("education", () => update("education", [...data.education, emptyEducation()]))}
    </>,
  );

  const projects = section(
    "Projects",
    data.projects.some(hasProject),
    <>
      {data.projects.map((item, index) =>
        editable || hasProject(item) ? (
          <div className={styles.item} key={index}>
            {remove(`project ${index + 1}`, () =>
              update(
                "projects",
                data.projects.filter((_, i) => i !== index),
              ),
            )}
            {field(
              item.name,
              "Project name",
              (value) =>
                update(
                  "projects",
                  data.projects.map((entry, i) => (i === index ? { ...entry, name: value } : entry)),
                ),
              styles.itemTitle,
            )}
            {field(item.link, "Project URL", (value) =>
              update(
                "projects",
                data.projects.map((entry, i) => (i === index ? { ...entry, link: value } : entry)),
              ),
            )}
            {field(item.description, "Project description", (value) =>
              update(
                "projects",
                data.projects.map((entry, i) => (i === index ? { ...entry, description: value } : entry)),
              ),
            )}
          </div>
        ) : null,
      )}
      {editable && !data.projects.length && (
        <p className={styles.placeholder}>Project name · Description</p>
      )}
      {add("project", () => update("projects", [...data.projects, emptyProject()]))}
    </>,
  );

  const body = (
    <>
      {section(
        variant === "engineer" || variant === "ats-standard" ? "Summary" : "Profile",
        hasText(data.summary),
        field(data.summary, "Professional summary", (value) => update("summary", value)),
      )}
      {experience}
      {education}
      {projects}
    </>
  );

  const hasContact = contactKeys.some((key) => hasText(data[key]));

  return (
    <article className={`${styles.paper} ${styles[variant]} ${data.style ? styles.styled : ""}`} style={resumeStyleVariables(data.style)} aria-label={`${variant} resume`}>
      {(variant === "modern" || variant === "compact") ? (
        <>
          <aside className={styles.sidebar}>
            {section("Contact", hasContact, contact)}
            {skills}
            {awards}
            {extraFields}
          </aside>
          <div className={styles.main}>
            {name}
            {body}
          </div>
        </>
      ) : (
        <>
          <header>
            {name}
            {contact}
          </header>
          {body}
          {skills}
          {awards}
          {extraFields}
        </>
      )}
    </article>
  );
}
