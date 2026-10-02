import { OverlayDispatch } from "next/dist/next-devtools/dev-overlay/shared";
import { sampleJobDescription } from "./sample-job-description"



type SkillGap = {
  skill: string;
  importance: "required" | "preferred";
  note: string; // why it matters or how to close the gap
};

type SuggestedRewording = {
    original: string; // original content
    suggested: string // suggested change
    reason: string; // why rewording is better
}

type OverallFit = {
    matchScore: number // 0-100
    rating: "strong" | "medium" | "weak"
    summary: string // 2-3 sentences
}

type JobMatchResult = {
    missingKeywords: string[]
    skillGap: SkillGap[]
    suggestedRewording: SuggestedRewording[];
    overallFit: OverallFit
}