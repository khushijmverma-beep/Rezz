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
  jobDescriptionEvidence: string; // short phrase copied from the job description
};

export type SuggestedRewording = {
    original: string; // original content
    suggested: string; // suggested change
    reason: string; // why rewording is better
}

export type OverallFit = {
    matchScore: number; // 0-100
    rating: "strong" | "medium" | "weak";
    summary: string; // 2-3 sentences
}

export type Strength = {
    point: string;
    evidence: string;
}

export type CategoryScores = {
    skills: number;
    experience: number;
    education: number;
    keywords: number;
}

export type EmptyReasons = {
    missingKeywords?: string;
    skillGaps?: string;
    suggestedRewordings?: string;
}

export type JobMatchResult = {
    missingKeywords: string[];
    matchedKeywords: string[];
    skillGaps: SkillGap[];
    suggestedRewordings: SuggestedRewording[];
    strengths: Strength[];
    categoryScores: CategoryScores;
    actionItems: string[];
    overallFit: OverallFit;
    emptyReasons: EmptyReasons;
};