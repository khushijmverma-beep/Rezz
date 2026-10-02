// Shared types for job match. Used by the analyze-job-match route and
// components/AnalyzePanel.tsx, so changes here affect both files.
export type JobMatchRequest = {
    resumeText: string;
    jobDescription: string;
}

export type SkillGap = {
  skill: string;
  importance: "required" | "preferred";
  note: string; // why it matters or how to close the gap
};

export type SuggestedRewording = {
    original: string; // original content
    suggested: string // suggested change
    reason: string; // why rewording is better
}

export type OverallFit = {
    matchScore: number // 0-100
    rating: "strong" | "medium" | "weak"
    summary: string // 2-3 sentences
}

export type JobMatchResult = {
    missingKeywords: string[]
    skillGaps: SkillGap[]
    suggestedRewordings: SuggestedRewording[];
    overallFit: OverallFit
}