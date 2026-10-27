// Shared types for job match. Used by the analyze-job-match route and
// components/AnalyzePanel.tsx, so changes here affect both files.
import type { ResumeData } from "@/lib/types/resume";
export type CheckStatus = "pass" | "warn" | "fail";

export type ScoreCheck = {
    id: string;
    label: string;
    status: CheckStatus;
    reason: string;
    evidence?: string;
    points: number;
    maxPoints: number;
}



export type ScoreSection = {
    score: number;
    checks: ScoreCheck[]
}

export type TopFix = {
    text: string;
    gain: number 
}

export type JobMatchRequest = {
    resumeText?: string; 
    data?: ResumeData;  
    templateId?: string;
    jobDescription: string;
}

export type SkillGap = {
  skill: string;
  importance: "required" | "preferred";
  note: string; 
  jobDescriptionEvidence: string; 
};

export type SuggestedRewording = {
    original: string; 
    suggested: string; 
    reason: string; 
}

export type OverallFit = {
    matchScore: number; // 0-100
    rating: "strong" | "medium" | "weak";
    summary: string; 
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
} & Partial<ScoreResult>;

export type ScoreResult = {
    ats: ScoreSection;
    human: ScoreSection;
    topFixes: TopFix[];
    scorerVersion: string;
};
