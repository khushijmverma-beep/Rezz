import type { ScoreCheck, ScoreResult, TopFix } from "@/lib/types/job-match";
import type { ResumeData } from "@/lib/types/resume";
import { scoreAts } from "./ats";
import { scoreHuman, type AiJudgement } from "./human";

export const SCORER_VERSION = "0.1.0";

export type ScoreInput = {
  data: ResumeData;
  templateId: string;
  jobDescription: string;
  ai?: AiJudgement | null;
};


const FIX_TEXT: Record<string, string> = {

  keywords: "Add the missing job skills to your bullets or projects",
  sections: "Add the missing resume sections",
  template: "Switch to an ATS-friendly template",
  contact: "Add a valid email and phone number",
  dates: "Use one date format and add every end date",
  title: "Mention the job title in your summary or job titles",
  length: "Trim the resume to fit the page limit",

  actionVerbs: "Start weak bullets with a strong action verb",
  impact: "Add numbers (counts, %, time saved) to more bullets",
  bulletLength: "Rewrite bullets to 12 to 25 words",
  relevance: "Move job-relevant bullets to the top of each role",
  order: "List experience newest first",
  summary: "Make your summary specific: skills, focus, a result",
};

function topFixesFrom(checks: { check: ScoreCheck; view: string }[]): TopFix[] {
  return checks
    .filter(({ check }) => check.status !== "pass" && check.id !== "ai")
    .map(({ check, view }) => ({
      gain: check.maxPoints - check.points,
      text: `${FIX_TEXT[check.id] ?? check.label}: about +${check.maxPoints - check.points} ${view} points`,
    }))
    .filter((fix) => fix.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 5);
}

export async function scoreResume({ data, jobDescription, ai }: ScoreInput): Promise<ScoreResult> {
  // TODO: read atsFriendly for templateId
  const ats = scoreAts({ data, jobDescription });

  // TODO: pass the AI judgement once the model call is added.
  const human = scoreHuman({ data, jobDescription, ai });

  const topFixes = topFixesFrom([
    ...ats.checks.map((check) => ({ check, view: "ATS" })),
    ...human.checks.map((check) => ({ check, view: "recruiter" })),
  ]);

  return { ats, human, topFixes, scorerVersion: SCORER_VERSION };
}