import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import {
  emptyResumeData,
  type EducationItem,
  type ExperienceItem,
  type ProjectItem,
  type ResumeData,
} from "@/lib/types/resume";

export type { ResumeData, ExperienceItem, EducationItem, ProjectItem };
export const emptyDetails: ResumeData = emptyResumeData;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const strList = (v: unknown) =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : [];
const objList = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];

function splitName(first: unknown, last: unknown, full: unknown) {
  const firstName = str(first);
  const lastName = str(last);
  if (firstName || lastName) return { firstName, lastName };
  const combined = str(full);
  const space = combined.indexOf(" ");
  if (space === -1) return { firstName: combined, lastName: "" };
  return { firstName: combined.slice(0, space), lastName: combined.slice(space + 1).trim() };
}

function splitDates(start: unknown, end: unknown, dates: unknown) {
  const startDate = str(start);
  const endDate = str(end);
  if (startDate || endDate) return { startDate, endDate };
  const combined = str(dates);
  const parts = combined.split(/\s*[–—-]\s*/).filter(Boolean);
  if (parts.length >= 2) return { startDate: parts[0], endDate: parts.slice(1).join(" - ") };
  return { startDate: combined, endDate: "" };
}

function pickLinks(raw: Record<string, unknown>) {
  let linkedin = str(raw.linkedin);
  let github = str(raw.github);
  let website = str(raw.website || raw.url);
  for (const link of strList(raw.links)) {
    const lower = link.toLowerCase();
    if (!linkedin && lower.includes("linkedin")) linkedin = link;
    else if (!github && (lower.includes("github.com") || lower.includes("github"))) github = link;
    else if (!website) website = link;
  }
  return { linkedin, github, website };
}

export function normalizeDetails(raw: unknown): ResumeData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const name = splitName(r.firstName, r.lastName, r.fullName ?? r.name);

  return {
    ...name,
    email: str(r.email),
    phone: str(r.phone),
    location: str(r.location),
    ...pickLinks(r),
    summary: str(r.summary ?? r.about),
    experience: objList(r.experience).map((e) => ({
      company: str(e.company),
      title: str(e.title),
      location: str(e.location),
      ...splitDates(e.startDate, e.endDate, e.dates),
      bullets: Array.isArray(e.bullets)
        ? strList(e.bullets)
        : str(e.description).split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean),
    })),
    education: objList(r.education).map((e) => ({
      school: str(e.school),
      degree: str(e.degree),
      field: str(e.field),
      ...splitDates(e.startDate, e.endDate, e.dates),
      gpa: str(e.gpa),
    })),
    skills: strList(r.skills),
    projects: objList(r.projects).map((p) => ({
      name: str(p.name),
      link: str(p.link || p.url),
      description: str(p.description),
    })),
    awards: strList(r.awards).length
      ? strList(r.awards)
      : objList(r.awards).map((a) => str(a.title)).filter(Boolean),
  };
}

const sameItem = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const hasContent = (it: object) =>
  Object.values(it).some((v) => (Array.isArray(v) ? v.length > 0 : String(v).trim() !== ""));
const hasDetails = (details: ResumeData) =>
  Object.values(details).some((value) =>
    typeof value === "string"
      ? value.trim() !== ""
      : value.some((item) =>
          typeof item === "string" ? item.trim() !== "" : hasContent(item),
        ),
  );

function appendNew<T>(base: T[], incoming: T[]): T[] {
  const out = [...base];
  for (const item of incoming) {
    if (typeof item === "object" && item !== null && !hasContent(item)) continue;
    if (!out.some((x) => sameItem(x, item))) out.push(item);
  }
  return out;
}

export function mergeDetails(current: ResumeData, incomingRaw: unknown): ResumeData {
  const inc = normalizeDetails(incomingRaw);
  return {
    firstName: current.firstName || inc.firstName,
    lastName: current.lastName || inc.lastName,
    email: current.email || inc.email,
    phone: current.phone || inc.phone,
    location: current.location || inc.location,
    linkedin: current.linkedin || inc.linkedin,
    github: current.github || inc.github,
    website: current.website || inc.website,
    summary: current.summary || inc.summary,
    experience: appendNew(current.experience, inc.experience),
    education: appendNew(current.education, inc.education),
    skills: appendNew(current.skills, inc.skills),
    projects: appendNew(current.projects, inc.projects),
    awards: appendNew(current.awards, inc.awards),
  };
}

export function cleanDetails(d: ResumeData): ResumeData {
  return {
    ...d,
    skills: d.skills.map((s) => s.trim()).filter(Boolean),
    awards: d.awards.map((s) => s.trim()).filter(Boolean),
    experience: d.experience
      .map((e) => ({ ...e, bullets: e.bullets.map((b) => b.trim()).filter(Boolean) }))
      .filter(hasContent),
    education: d.education.filter(hasContent),
    projects: d.projects.filter(hasContent),
  };
}

const db = getFirestore(app);

export async function getResumeDetails(uid: string): Promise<ResumeData | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  const details = normalizeDetails(data.defaultDetails ?? data);
  return hasDetails(details) ? details : null;
}

export async function saveResumeDetails(uid: string, data: ResumeData): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    { defaultDetails: data, detailsUpdatedAt: serverTimestamp() },
    { merge: true },
  );
}

export type Experience = ExperienceItem;
export type Education = EducationItem;
export type Project = ProjectItem;
