import type { ScoreCheck, ScoreResult, TopFix } from "@/lib/types/job-match";
import type { ResumeData } from "@/lib/types/resume";
import { scoreAts } from "./ats";

export const SCORER_VERSION = "0.1.0";

export type ScoreInput = {
  data: ResumeData;
  templateId: string;
  jobDescription: string;
};


const FIX_TEXT: Record<string, string> = {
  keywords: "Add the missing job skills to your bullets or projects",
  sections: "Add the missing resume sections",
  template: "Switch to an ATS-friendly template",
  contact: "Add a valid email and phone number",
  dates: "Use one date format and add every end date",
  title: "Mention the job title in your summary or job titles",
  length: "Trim the resume to fit the page limit",
};

function topFixesFrom(checks: { check: ScoreCheck; view: string }[]): TopFix[] {
  return checks
    .filter(({ check }) => check.status !== "pass")
    .map(({ check, view }) => ({
      gain: check.maxPoints - check.points,
      text: `${FIX_TEXT[check.id] ?? check.label}: about +${check.maxPoints - check.points} ${view} points`,
    }))
    .filter((fix) => fix.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 5);
}

export async function scoreResume({ data, jobDescription }: ScoreInput): Promise<ScoreResult> {

  const ats = scoreAts({ data, jobDescription });


  const human = {
    score: 65,
    checks: [
      {
        id: "impact",
        label: "Impact",
        status: "fail" as const,
        reason: "Placeholder: recruiter checks not built yet.",
        points: 5,
        maxPoints: 15,
      },
    ],
  };

  const topFixes = topFixesFrom([
    ...ats.checks.map((check) => ({ check, view: "ATS" })),
    ...human.checks.map((check) => ({ check, view: "recruiter" })),
  ]);

  return { ats, human, topFixes, scorerVersion: SCORER_VERSION };
}