import type { ResumeData } from "@/lib/types/resume";
import type { CheckStatus, ScoreCheck, ScoreSection } from "@/lib/types/job-match";
import { compareKeywords, findEvidence, hasSkill, normalize } from "@/lib/jobKeywords";
import { ATS_WEIGHTS, KEYWORD_WEIGHTS, LENGTH_LIMITS, STATUS_THRESHOLDS } from "./weights";

export type AtsInput = {
  data: ResumeData;
  jobDescription: string;
  atsFriendly?: boolean;
  now?: Date; 
};



export function statusFor(points: number, maxPoints: number): CheckStatus {
  if (maxPoints === 0) return "pass";
  const ratio = points / maxPoints;
  if (ratio >= STATUS_THRESHOLDS.pass) return "pass";
  if (ratio >= STATUS_THRESHOLDS.warn) return "warn";
  return "fail";
}

type CheckInput = {
  id: string;
  label: string;
  maxPoints: number;
  fraction: number; 
  reason: string;
  evidence?: string;
  status?: CheckStatus; 
};

export function makeCheck(input: CheckInput): ScoreCheck {
  const fraction = Math.min(1, Math.max(0, input.fraction));
  const points = Math.round(input.maxPoints * fraction);
  return {
    id: input.id,
    label: input.label,
    status: input.status ?? statusFor(points, input.maxPoints),
    reason: input.reason,
    // Firestore rejects undefined values, so leave the key out entirely
    ...(input.evidence ? { evidence: input.evidence } : {}),
    points,
    maxPoints: input.maxPoints,
  };
}

const filled = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);

export function resumeText(data: ResumeData): string {
  const lines = [
    `${data.firstName} ${data.lastName}`,
    data.email,
    data.phone,
    data.location,
    data.summary,
    ...data.experience.flatMap((e) => [
      `${e.title} ${e.company} ${e.location}`,
      `${e.startDate} ${e.endDate}`,
      ...e.bullets,
    ]),
    ...data.education.flatMap((e) => [
      `${e.degree} ${e.field} ${e.school}`,
      `${e.startDate} ${e.endDate}`,
      e.gpa,
    ]),
    data.skills.join(", "),
    ...data.projects.flatMap((p) => [p.name, p.description]),
    ...data.awards,
    ...(data.certifications ?? []),
    ...(data.languages ?? []),
  ];
  return filled(lines).join("\n");
}

export function bullets(data: ResumeData): string[] {
  return filled(data.experience.flatMap((e) => e.bullets));
}


function usedText(data: ResumeData): string {
  return [...bullets(data), ...filled(data.projects.map((p) => p.description))].join("\n");
}



function keywordCheck(data: ResumeData, jobDescription: string): ScoreCheck {
  const base = { id: "keywords", label: "Keyword match", maxPoints: ATS_WEIGHTS.keywords };
  const { requirements } = compareKeywords(resumeText(data), jobDescription);

  if (requirements.length === 0) {
    return makeCheck({
      ...base,
      fraction: 1,
      status: "warn",
      reason: "No hard skills were found in the job description, so keywords couldn't be checked.",
    });
  }

  const used = usedText(data);
  let possible = 0;
  let earned = 0;
  let listedOnly = 0;
  const missing: { label: string; required: boolean; phrase: string }[] = [];

  for (const req of requirements) {
    const evidence = findEvidence(req.skills, jobDescription);
    const weight =
      evidence.section === "required"
        ? KEYWORD_WEIGHTS.required
        : evidence.section === "preferred"
          ? KEYWORD_WEIGHTS.preferred
          : KEYWORD_WEIGHTS.unlabeled;
    possible += weight;

    if (!req.matchedSkill) {
      missing.push({ label: req.label, required: evidence.section === "required", phrase: evidence.phrase });
      continue;
    }
    if (hasSkill(used, req.matchedSkill)) {
      earned += weight * KEYWORD_WEIGHTS.inContext;
    } else {
      earned += weight * KEYWORD_WEIGHTS.listedOnly;
      listedOnly++;
    }
  }

  missing.sort((a, b) => Number(b.required) - Number(a.required)); // required first
  const found = requirements.length - missing.length;
  const parts = [`${found} of ${requirements.length} skills from the job description found.`];
  if (missing.length > 0) {
    const shown = missing.slice(0, 5).map((m) => m.label).join(", ");
    parts.push(`Missing: ${shown}${missing.length > 5 ? ", and more" : ""}.`);
  }
  if (listedOnly > 0) {
    parts.push(`${listedOnly} only appear in your Skills list, not in a bullet or project.`);
  }

  return makeCheck({
    ...base,
    fraction: earned / possible,
    reason: parts.join(" "),
    evidence: missing[0]?.phrase || undefined,
  });
}

function sectionsCheck(data: ResumeData): ScoreCheck {
  const sections: [string, boolean][] = [
    ["Experience", data.experience.some((e) => e.title.trim() || e.company.trim())],
    ["Education", data.education.some((e) => e.school.trim())],
    ["Skills", filled(data.skills).length > 0],
    ["Projects", data.projects.some((p) => p.name.trim())],
  ];
  const missing = sections.filter(([, present]) => !present).map(([name]) => name);

  return makeCheck({
    id: "sections",
    label: "Standard sections",
    maxPoints: ATS_WEIGHTS.sections,
    fraction: (sections.length - missing.length) / sections.length,
    reason:
      missing.length === 0
        ? "Experience, Education, Skills, and Projects are all present."
        : `Missing: ${missing.join(", ")}.`,
  });
}

function templateCheck(atsFriendly: boolean | undefined): ScoreCheck {
  const base = { id: "template", label: "Parseable template", maxPoints: ATS_WEIGHTS.template };
  if (atsFriendly === undefined) {
    return makeCheck({ ...base, fraction: 0.5, reason: "This template hasn't been rated for ATS parsing yet." });
  }
  return makeCheck({
    ...base,
    fraction: atsFriendly ? 1 : 0,
    reason: atsFriendly
      ? "Single-column template with no images or icons."
      : "This template uses columns or graphics that ATS parsers can misread.",
  });
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function contactCheck(data: ResumeData): ScoreCheck {
  const email = data.email.trim();
  const phoneDigits = data.phone.replace(/\D/g, "");
  const emailOk = EMAIL.test(email);
  const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 15;

  const problems: string[] = [];
  if (!emailOk) problems.push(email ? "the email looks malformed" : "no email");
  if (!phoneOk) problems.push(data.phone.trim() ? "the phone number looks incomplete" : "no phone number");

  return makeCheck({
    id: "contact",
    label: "Contact info",
    maxPoints: ATS_WEIGHTS.contact,
    fraction: (Number(emailOk) + Number(phoneOk)) / 2,
    reason:
      problems.length === 0
        ? "Email and phone are present and well formed."
        : `Found ${problems.join(" and ")}.`,
  });
}

const PRESENT = /^(present|current|now)$/i;

function dateFormat(raw: string): string {
  const s = raw.trim().replace(/^expected\s+/i, "");
  if (/^[A-Za-z]{3,9}\.?\s+\d{4}$/.test(s)) return "Month YYYY";
  if (/^\d{1,2}\/\d{4}$/.test(s)) return "MM/YYYY";
  if (/^\d{1,2}\/\d{2}$/.test(s)) return "MM/YY";
  if (/^\d{4}-\d{2}$/.test(s)) return "YYYY-MM";
  if (/^\d{4}$/.test(s)) return "YYYY";
  return "other";
}

function datesCheck(data: ResumeData): ScoreCheck {
  const base = { id: "dates", label: "Dates", maxPoints: ATS_WEIGHTS.dates };
  const entries = [
    ...data.experience
      .filter((e) => e.title.trim() || e.company.trim())
      .map((e) => ({ where: e.company.trim() || e.title.trim(), start: e.startDate, end: e.endDate })),
    ...data.education
      .filter((e) => e.school.trim())
      .map((e) => ({ where: e.school.trim(), start: e.startDate, end: e.endDate })),
  ];

  if (entries.length === 0) {
    return makeCheck({ ...base, fraction: 1, status: "warn", reason: "No dated entries to check yet." });
  }

  const missingEnd = entries.filter((e) => !e.end.trim()).map((e) => e.where);
  const formats = new Map<string, string>(); // format -> first example seen
  for (const e of entries) {
    for (const d of [e.start, e.end]) {
      const t = d.trim();
      if (!t || PRESENT.test(t)) continue;
      const f = dateFormat(t);
      if (!formats.has(f)) formats.set(f, t);
    }
  }

  let fraction = 1;
  const parts: string[] = [];
  if (missingEnd.length > 0) {
    fraction -= 0.5;
    parts.push(`Missing end date for ${missingEnd.join(", ")}.`);
  }
  if (formats.size > 1) {
    fraction -= 0.5;
    parts.push(`Dates use ${formats.size} different formats.`);
  }

  return makeCheck({
    ...base,
    fraction,
    reason: parts.length > 0 ? parts.join(" ") : "Every entry has an end date and all dates use one format.",
    evidence:
      formats.size > 1
        ? [...formats.values()].slice(0, 3).map((v) => `"${v}"`).join(" vs ")
        : undefined,
  });
}

const TITLE_NOISE = new Set([
  "intern", "internship", "senior", "sr", "junior", "jr", "lead", "principal", "staff",
  "summer", "fall", "spring", "winter", "new", "grad", "graduate", "entry", "level",
  "co-op", "coop", "i", "ii", "iii", "iv", "the", "of", "and", "for", "a", "an", "in",
  "to", "remote", "hybrid", "program",
]);


export function jobTitleFrom(jobDescription: string): string {
  const first = jobDescription.split(/\r?\n/).map(normalize).find((l) => l.length > 0) ?? "";
  return first.split(/\s[-|]\s|\s\(|,/)[0].trim();
}

function coreTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/)
    .filter((t) => t && !TITLE_NOISE.has(t) && !/^\d{4}$/.test(t));
}

// "engineer" matches "engineering", but short words must match exactly.
function tokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  return Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a));
}

function titleCheck(data: ResumeData, jobDescription: string): ScoreCheck {
  const base = { id: "title", label: "Title alignment", maxPoints: ATS_WEIGHTS.title };
  const title = jobTitleFrom(jobDescription);
  const core = coreTokens(title);

  if (!title || title.length > 80 || core.length === 0) {
    return makeCheck({
      ...base,
      fraction: 0.5,
      reason: "Couldn't read a job title from the first line of the job description.",
    });
  }

  const resumeWords = coreTokens([...data.experience.map((e) => e.title), data.summary].join(" "));
  const missing = core.filter((t) => !resumeWords.some((w) => tokenMatch(t, w)));

  return makeCheck({
    ...base,
    fraction: (core.length - missing.length) / core.length,
    reason:
      missing.length === 0
        ? "Your job titles or summary match the posting's title."
        : `Your titles and summary don't mention: ${missing.join(", ")}.`,
    evidence: title,
  });
}

function yearsOfExperience(data: ResumeData, now: Date): number {
  const years = data.experience
    .map((e) => e.startDate.match(/\d{4}/)?.[0])
    .filter((y): y is string => !!y)
    .map(Number);
  return years.length === 0 ? 0 : now.getFullYear() - Math.min(...years);
}

function lengthCheck(data: ResumeData, now: Date): ScoreCheck {
  const words = resumeText(data).split(/\s+/).filter(Boolean).length;
  const senior = yearsOfExperience(data, now) >= LENGTH_LIMITS.seniorYears;
  const limit = senior ? LENGTH_LIMITS.twoPageWords : LENGTH_LIMITS.onePageWords;
  const pages = senior ? "two pages" : "one page";
  const fraction = words <= limit ? 1 : words <= limit + LENGTH_LIMITS.warnSlack ? 0.5 : 0;

  return makeCheck({
    id: "length",
    label: "Length",
    maxPoints: ATS_WEIGHTS.length,
    fraction,
    reason:
      fraction === 1
        ? `About ${words} words, which should fit on ${pages}.`
        : `About ${words} words, likely more than ${pages} (aim for under ${limit}).`,
  });
}


export function scoreAts({ data, jobDescription, atsFriendly, now = new Date() }: AtsInput): ScoreSection {
  const checks = [
    keywordCheck(data, jobDescription),
    sectionsCheck(data),
    templateCheck(atsFriendly),
    contactCheck(data),
    datesCheck(data),
    titleCheck(data, jobDescription),
    lengthCheck(data, now),
  ];
  const score = checks.reduce((sum, c) => sum + c.points, 0);
  return { score: Math.min(100, score), checks };
}