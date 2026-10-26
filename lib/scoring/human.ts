import type { ResumeData } from "@/lib/types/resume";
import type { ScoreCheck, ScoreSection } from "@/lib/types/job-match";
import { findSkills, hasSkill, normalize } from "@/lib/jobKeywords";
import { bullets, makeCheck, resumeText } from "./ats";
import { HUMAN_LIMITS, HUMAN_WEIGHTS } from "./weights";

export type AiJudgement = { rating: number; reason: string; quote: string };

export type HumanInput = {
  data: ResumeData;
  jobDescription: string;
  ai?: AiJudgement | null; 
};

const WEAK_OPENERS = [
  "responsible for", "helped", "worked on", "worked with", "assisted", "assisting",
  "participated in", "involved in", "tasked with", "duties included", "in charge of",
];

const STRONG_VERBS = new Set([
  "achieved", "analyzed", "architected", "automated", "built", "collaborated", "configured",
  "coordinated", "created", "cut", "debugged", "delivered", "deployed", "designed", "developed",
  "drove", "enabled", "engineered", "established", "evaluated", "expanded", "implemented",
  "improved", "increased", "integrated", "launched", "led", "maintained", "managed", "mentored",
  "migrated", "negotiated", "optimized", "organized", "owned", "prepared", "processed",
  "prototyped", "published", "recovered", "reduced", "refactored", "resolved", "scaled",
  "scheduled", "shipped", "simplified", "spearheaded", "streamlined", "tested", "tracked",
  "trained", "transformed", "wrote",
]);

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const short = (s: string, max = 100) => (s.length > max ? `${s.slice(0, max - 3).trimEnd()}...` : s);

function isWeak(bullet: string): boolean {
  const lower = bullet.toLowerCase().trim();
  return WEAK_OPENERS.some((p) => lower === p || lower.startsWith(`${p} `));
}

function isStrong(bullet: string): boolean {
  if (isWeak(bullet)) return false;
  const first = (words(bullet)[0] ?? "").toLowerCase().replace(/[^a-z]/g, "");
  // Unlisted past-tense verbs ("Reconciled") count too.
  return STRONG_VERBS.has(first) || (first.length > 4 && first.endsWith("ed"));
}


function noBullets(id: string, label: string, maxPoints: number): ScoreCheck {
  return makeCheck({ id, label, maxPoints, fraction: 0, reason: "No experience bullets to check." });
}

function actionVerbsCheck(list: string[]): ScoreCheck {
  const base = { id: "actionVerbs", label: "Action verbs", maxPoints: HUMAN_WEIGHTS.actionVerbs };
  if (list.length === 0) return noBullets(base.id, base.label, base.maxPoints);

  const weak = list.filter((b) => !isStrong(b));
  return makeCheck({
    ...base,
    fraction: (list.length - weak.length) / list.length,
    reason:
      weak.length === 0
        ? "Every bullet starts with a strong action verb."
        : `${weak.length} of ${list.length} bullets don't start with a strong action verb.`,
    evidence: weak[0] ? short(weak[0]) : undefined,
  });
}

const HAS_NUMBER = /\d|%|\$|\b(hundreds?|thousands?|millions?|dozens?)\b/i;

function impactCheck(list: string[]): ScoreCheck {
  const base = { id: "impact", label: "Impact", maxPoints: HUMAN_WEIGHTS.impact };
  if (list.length === 0) return noBullets(base.id, base.label, base.maxPoints);

  const withNumbers = list.filter((b) => HAS_NUMBER.test(b));
  const without = list.filter((b) => !HAS_NUMBER.test(b));
  return makeCheck({
    ...base,
    fraction: withNumbers.length / list.length / HUMAN_LIMITS.impactTarget,
    reason: `${withNumbers.length} of ${list.length} bullets include a number, percent, or scale.`,
    evidence: without[0] ? short(without[0]) : undefined,
  });
}

function bulletLengthCheck(list: string[]): ScoreCheck {
  const base = { id: "bulletLength", label: "Bullet length", maxPoints: HUMAN_WEIGHTS.bulletLength };
  if (list.length === 0) return noBullets(base.id, base.label, base.maxPoints);

  const { bulletMinWords: min, bulletMaxWords: max } = HUMAN_LIMITS;
  const tooLong = list.filter((b) => words(b).length > max);
  const tooShort = list.filter((b) => words(b).length < min);
  const good = list.length - tooLong.length - tooShort.length;

  const parts = [`${good} of ${list.length} bullets are ${min} to ${max} words.`];
  if (tooLong.length) parts.push(`${tooLong.length} too long.`);
  if (tooShort.length) parts.push(`${tooShort.length} too short.`);

  return makeCheck({
    ...base,
    fraction: good / list.length,
    reason: parts.join(" "),
    evidence: short(tooLong[0] ?? tooShort[0] ?? ""),
  });
}

function relevanceCheck(data: ResumeData, jobDescription: string): ScoreCheck {
  const base = { id: "relevance", label: "Relevance", maxPoints: HUMAN_WEIGHTS.relevance };
  const jdSkills = findSkills(jobDescription);
  const jobs = data.experience.filter((e) => e.bullets.some((b) => b.trim()));

  if (jdSkills.length === 0 || jobs.length === 0) {
    return makeCheck({
      ...base,
      fraction: 1,
      status: "warn",
      reason: jobs.length === 0 ? "No experience bullets to check." : "No skills found in the job description to compare.",
    });
  }

  const offTopic = jobs.filter((job) => {
    const top = job.bullets.map((b) => b.trim()).filter(Boolean).slice(0, HUMAN_LIMITS.topBulletsPerJob).join("\n");
    return !jdSkills.some((skill) => hasSkill(top, skill));
  });
  const names = offTopic.map((j) => j.company.trim() || j.title.trim());

  return makeCheck({
    ...base,
    fraction: (jobs.length - offTopic.length) / jobs.length,
    reason:
      offTopic.length === 0
        ? "Each job's top bullets mention skills from the posting."
        : `Top bullets don't mention the posting's skills for: ${names.join(", ")}.`,
  });
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];


function dateValue(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/^expected\s+/, "");
  if (!s) return null;
  if (/^(present|current|now)$/.test(s)) return Number.POSITIVE_INFINITY;
  const year = s.match(/\d{4}/)?.[0];
  if (!year) return null;
  const named = MONTHS.findIndex((m) => s.startsWith(m));
  const numbered = s.match(/^(\d{1,2})\//)?.[1];
  const month = named >= 0 ? named : numbered ? Number(numbered) - 1 : 0;
  return Number(year) * 12 + month;
}

function orderCheck(data: ResumeData): ScoreCheck {
  const base = { id: "order", label: "Order", maxPoints: HUMAN_WEIGHTS.order };
  const dated = data.experience
    .filter((e) => e.title.trim() || e.company.trim())
    .map((e) => ({ name: e.company.trim() || e.title.trim(), value: dateValue(e.endDate) ?? dateValue(e.startDate) }))
    .filter((e): e is { name: string; value: number } => e.value !== null);

  if (dated.length < 2) {
    return makeCheck({ ...base, fraction: 1, reason: "Fewer than two dated jobs, so order doesn't matter." });
  }

  const i = dated.findIndex((e, idx) => idx > 0 && e.value > dated[idx - 1].value);
  return makeCheck({
    ...base,
    fraction: i === -1 ? 1 : 0,
    reason:
      i === -1
        ? "Experience is listed newest first."
        : `${dated[i].name} is newer than ${dated[i - 1].name} but listed below it.`,
  });
}

const GENERIC = [
  "hard-working", "hardworking", "team player", "detail-oriented", "detail oriented",
  "results-driven", "results driven", "passionate", "motivated", "self-starter", "self starter",
  "fast learner", "quick learner", "go-getter", "dynamic", "excellent communication",
  "strong work ethic", "outside the box",
];

function summaryCheck(data: ResumeData): ScoreCheck {
  const base = { id: "summary", label: "Summary", maxPoints: HUMAN_WEIGHTS.summary };
  const summary = data.summary.trim();
  if (!summary) {
    return makeCheck({ ...base, fraction: 0.5, reason: "No summary. It's optional, but a specific one helps." });
  }

  const lower = summary.toLowerCase();
  const found = GENERIC.filter((p) => lower.includes(p));
  const count = words(summary).length;
  const specific = findSkills(summary).length > 0 || /\d/.test(summary);
  const badLength = count < HUMAN_LIMITS.summaryMinWords || count > HUMAN_LIMITS.summaryMaxWords;

  const parts: string[] = [];
  if (found.length) parts.push(`Uses ${found.length} generic phrase${found.length > 1 ? "s" : ""}.`);
  if (!specific) parts.push("Mentions no specific skills or numbers.");
  if (badLength) parts.push(`${count} words; aim for ${HUMAN_LIMITS.summaryMinWords} to ${HUMAN_LIMITS.summaryMaxWords}.`);


  const idx = found[0] ? lower.indexOf(found[0]) : -1;
  return makeCheck({
    ...base,
    fraction: 1 - 0.25 * Math.min(found.length, 2) - (specific ? 0 : 0.5) - (badLength ? 0.25 : 0),
    reason: parts.length ? parts.join(" ") : "Specific: names skills or results, no filler phrases.",
    evidence: idx >= 0 ? summary.slice(idx, idx + found[0].length) : undefined,
  });
}




export function quoteInResume(quote: string, data: ResumeData): boolean {
  const q = normalize(quote).toLowerCase();
  return q.length >= 8 && normalize(resumeText(data)).toLowerCase().includes(q);
}



export function scoreHuman({ data, jobDescription, ai }: HumanInput): ScoreSection {
  const list = bullets(data);
  const checks = [
    actionVerbsCheck(list),
    impactCheck(list),
    bulletLengthCheck(list),
    relevanceCheck(data, jobDescription),
    orderCheck(data),
    summaryCheck(data),
  ];
  const codePoints = checks.reduce((sum, c) => sum + c.points, 0);
  const codeMax = checks.reduce((sum, c) => sum + c.maxPoints, 0);

  if (ai && quoteInResume(ai.quote, data)) {
    const rating = Math.min(5, Math.max(1, Math.round(ai.rating)));
    checks.push(
      makeCheck({
        id: "ai",
        label: "Recruiter read",
        maxPoints: HUMAN_WEIGHTS.aiJudgement,
        fraction: (rating - 1) / 4,
        reason: `Rated ${rating} of 5: ${ai.reason}`,
        evidence: ai.quote,
      }),
    );
    return { score: checks.reduce((sum, c) => sum + c.points, 0), checks };
  }


  checks.push({
    id: "ai",
    label: "Recruiter read",
    status: "warn",
    reason: ai
      ? "The AI's quote wasn't found in your resume, so its rating was dropped. Scored from code checks only."
      : "AI judgement unavailable. Scored from code checks only.",
    points: 0,
    maxPoints: 0,
  });
  return { score: Math.round((codePoints / codeMax) * 100), checks };
}