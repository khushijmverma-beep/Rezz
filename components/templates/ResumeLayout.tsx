"use client";

import type { ReactNode } from "react";
import type { Education, Experience, Project, ResumeData, TemplateId, TemplateProps } from "@/lib/types/resume";
import EditableText from "./EditableText";
import styles from "./templates.module.css";

const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);
const hasContent = (item: Experience | Education | Project) => Object.entries(item).some(([key, value]) => key !== "id" && (Array.isArray(value) ? value.some((entry) => entry.trim()) : value.trim()));

export default function ResumeLayout({ data, editable = false, onChange, variant }: TemplateProps & { variant: TemplateId }) {
  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => onChange?.({ ...data, [key]: value });
  const field = (value: string, placeholder: string, commit: (value: string) => void, className = "", tag: "span" | "h1" | "p" = "p") => (
    editable || value.trim() ? <EditableText value={value} placeholder={placeholder} editable={editable} onCommit={commit} className={className} tag={tag} /> : null
  );
  const section = (title: string, visible: boolean, children: ReactNode) => (editable || visible) && <section className={styles.section}><h2>{title}</h2>{children}</section>;
  const remove = (label: string, action: () => void) => editable && <button type="button" className={styles.remove} aria-label={`Remove ${label}`} onClick={action}>×</button>;
  const add = (label: string, action: () => void) => editable && <button type="button" className={styles.add} onClick={action}>+ Add {label}</button>;
  const contact = <div className={styles.contact}>{(["email", "phone", "location", "website"] as const).map((key) => <div key={key}>{field(data[key], { email: "Email", phone: "Phone", location: "Location", website: "Website" }[key], (value) => update(key, value))}</div>)}</div>;
  const skills = section("Skills", data.skills.some((skill) => skill.trim()), field(data.skills.join(", "), "Skills, separated by commas", (value) => update("skills", value.split(",").map((skill) => skill.trim()).filter(Boolean))));
  const awards = section("Awards", data.awards.some((award) => award.trim()), field(data.awards.join("\n"), "Awards, one per line", (value) => update("awards", lines(value))));
  const name = field(data.name, "Your name", (value) => update("name", value), styles.name, "h1");
  const body = <>
    {section("Profile", !!data.summary.trim(), field(data.summary, "Professional summary", (value) => update("summary", value)))}
    {section("Experience", data.experience.some(hasContent), <>
      {data.experience.map((item, index) => (editable || hasContent(item)) && <div className={styles.item} key={item.id}>
        {remove(`experience ${index + 1}`, () => update("experience", data.experience.filter((_, i) => i !== index)))}
        {(["title", "company", "location", "dates"] as const).map((key) => <div key={key}>{field(item[key], { title: "Job title", company: "Company", location: "Job location", dates: "Employment dates" }[key], (value) => update("experience", data.experience.map((entry, i) => i === index ? { ...entry, [key]: value } : entry)), key === "title" ? styles.itemTitle : key === "dates" ? styles.dates : "")}</div>)}
        {editable ? field(item.bullets.join("\n"), "Achievements, one per line", (value) => update("experience", data.experience.map((entry, i) => i === index ? { ...entry, bullets: lines(value) } : entry))) : <ul>{item.bullets.filter((bullet) => bullet.trim()).map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>}
      </div>)}
      {editable && !data.experience.length && <p className={styles.placeholder}>Job title · Company · Achievements</p>}
      {add("experience", () => update("experience", [...data.experience, { id: crypto.randomUUID(), title: "", company: "", location: "", dates: "", bullets: [] }]))}
    </>)}
    {section("Education", data.education.some(hasContent), <>
      {data.education.map((item, index) => (editable || hasContent(item)) && <div className={styles.item} key={item.id}>
        {remove(`education ${index + 1}`, () => update("education", data.education.filter((_, i) => i !== index)))}
        {(["school", "degree", "dates", "details"] as const).map((key) => <div key={key}>{field(item[key], { school: "School", degree: "Degree", dates: "Education dates", details: "Education details" }[key], (value) => update("education", data.education.map((entry, i) => i === index ? { ...entry, [key]: value } : entry)), key === "school" ? styles.itemTitle : key === "dates" ? styles.dates : "")}</div>)}
      </div>)}
      {editable && !data.education.length && <p className={styles.placeholder}>School · Degree</p>}
      {add("education", () => update("education", [...data.education, { id: crypto.randomUUID(), school: "", degree: "", dates: "", details: "" }]))}
    </>)}
    {section("Projects", data.projects.some(hasContent), <>
      {data.projects.map((item, index) => (editable || hasContent(item)) && <div className={styles.item} key={item.id}>
        {remove(`project ${index + 1}`, () => update("projects", data.projects.filter((_, i) => i !== index)))}
        {(["name", "url", "description"] as const).map((key) => <div key={key}>{field(item[key], { name: "Project name", url: "Project URL", description: "Project description" }[key], (value) => update("projects", data.projects.map((entry, i) => i === index ? { ...entry, [key]: value } : entry)), key === "name" ? styles.itemTitle : "")}</div>)}
      </div>)}
      {editable && !data.projects.length && <p className={styles.placeholder}>Project name · Description</p>}
      {add("project", () => update("projects", [...data.projects, { id: crypto.randomUUID(), name: "", url: "", description: "" }]))}
    </>)}
  </>;
  return <article className={`${styles.paper} ${styles[variant]}`} aria-label={`${variant} resume`}>
    {variant === "modern" ? <><aside className={styles.sidebar}>{section("Contact", [data.email, data.phone, data.location, data.website].some((value) => value.trim().length > 0), contact)}{skills}{awards}</aside><div className={styles.main}>{name}{body}</div></> : <><header>{name}{contact}</header>{body}{skills}{awards}</>}
  </article>;
}
