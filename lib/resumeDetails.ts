import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";

export type Experience = { company: string; title: string; dates: string; bullets: string[] };
export type Education = { school: string; degree: string; dates: string };
export type Project = { name: string; link: string; description: string };

export type ResumeData = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  awards: string[];
};

export const emptyDetails: ResumeData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  links: [],
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  awards: [],
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const strList = (v: unknown) =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : [];
const objList = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];

// turns anything (Firestore doc, AI output) into a clean ResumeData
// also accepts a few alternate names so the AI route and this page don't have to match exactly
export function normalizeDetails(raw: unknown): ResumeData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const links = strList(r.links);
  if (!links.length && str(r.linkedin)) links.push(str(r.linkedin));

  return {
    fullName: str(r.fullName ?? r.name),
    email: str(r.email),
    phone: str(r.phone),
    location: str(r.location),
    links,
    summary: str(r.summary ?? r.about),
    experience: objList(r.experience).map((e) => ({
      company: str(e.company),
      title: str(e.title),
      dates: str(e.dates),
      bullets: Array.isArray(e.bullets)
        ? strList(e.bullets)
        : str(e.description).split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean),
    })),
    education: objList(r.education).map((e) => ({
      school: str(e.school),
      degree: str(e.degree),
      dates: str(e.dates),
    })),
    skills: strList(r.skills),
    projects: objList(r.projects).map((p) => ({
      name: str(p.name),
      link: str(p.link),
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
    fullName: current.fullName || inc.fullName,
    email: current.email || inc.email,
    phone: current.phone || inc.phone,
    location: current.location || inc.location,
    summary: current.summary || inc.summary,
    links: appendNew(current.links, inc.links),
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
    links: d.links.map((s) => s.trim()).filter(Boolean),
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
  return sameItem(details, emptyDetails) ? null : details;
}

export async function saveResumeDetails(uid: string, data: ResumeData): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    { defaultDetails: data, detailsUpdatedAt: serverTimestamp() },
    { merge: true }
  );
}