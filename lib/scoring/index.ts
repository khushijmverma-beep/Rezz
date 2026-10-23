import type { ScoreResult } from "@/lib/types/job-match";
import type { ResumeData } from "@/lib/types/resume";

export const SCORER_VERSION = "0.0.0-stub";

export type ScoreInput = {
  data: ResumeData;
  templateId: string;
  jobDescription: string;
};

export async function scoreResume(_input: ScoreInput): Promise<ScoreResult> {
  return {
    ats: {
      score: 72,
      checks: [
        {
          id: "keywords",
          label: "Keyword match",
          status: "warn",
          reason: "Placeholder: 6 of 10 required skills found.",
          evidence: "Experience with React and TypeScript",
          points: 20,
        },
      ],
    },
    human: {
      score: 65,
      checks: [
        {
          id: "impact",
          label: "Impact",
          status: "fail",
          reason: "Placeholder: 2 of 8 bullets include a number.",
          points: 5,
        },
      ],
    },
    topFixes: [{ text: "Placeholder: add numbers to 4 bullets", gain: 6 }],
    scorerVersion: SCORER_VERSION,
  };
}