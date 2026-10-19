"use client";

import { useState, type FormEvent } from "react";
import type { JobMatchResult } from "@/lib/types/job-match";
import styles from "./AnalyzePanel.module.css";

type AnalyzePanelProps = {
  resumeText: string;
  onResult?: (result: JobMatchResult) => void;
};

const CATEGORY_LABELS: { key: keyof JobMatchResult["categoryScores"]; label: string }[] = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "keywords", label: "Keywords" },
];

const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n || 0)));

function ratingClass(score: number): string {
  if (score >= 75) return styles.strong;
  if (score >= 50) return styles.medium;
  return styles.weak;
}

export default function AnalyzePanel({ resumeText, onResult }: AnalyzePanelProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  async function runAnalysis() {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setCopiedIndex(null);
    setCheckedItems(new Set());

    try {
      const response = await fetch("/api/analyze-job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        if (response.status === 503 || response.status === 429) {
          setError(
            "The AI service is busy right now. Please try again in a minute."
          );
          return;
        }

        const message =
          typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Analysis failed";
        setError(message);
        return;
      }

      const matchResult = data as JobMatchResult;
      setResult(matchResult);
      try {
        onResult?.(matchResult);
      } catch (err) {
        console.error("onResult callback failed", err);
      }
    } catch {
      setError("Could not reach the analysis service");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAnalysis();
  }

  function handleEdit() {
    setResult(null);
    setError(null);
  }


  async function handleCopy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 2000);
    } catch {
      setCopiedIndex(null);
    }
  }


  function toggleItem(index: number) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }


  if (result) {
    const score = Math.max(0, Math.min(100, result.overallFit.matchScore));
    const scoreClass =
      result.overallFit.rating === "strong"
        ? styles.strong
        : result.overallFit.rating === "medium"
          ? styles.medium
          : styles.weak;
    const matchedKeywords = result.matchedKeywords ?? [];
    const missingKeywords = result.missingKeywords ?? [];
    const skillGaps = result.skillGaps ?? [];
    const strengths = result.strengths ?? [];
    const rewordings = result.suggestedRewordings ?? [];
    const actionItems = result.actionItems ?? [];
    const emptyReasons = result.emptyReasons ?? {};

    const importanceBySkill = new Map(skillGaps.map((gap) => [gap.skill, gap.importance]));
    const requiredGaps = skillGaps.filter((gap) => gap.importance === "required");
    const preferredGaps = skillGaps.filter((gap) => gap.importance !== "required");

    const renderGap = (gap: (typeof skillGaps)[number]) => (
      <li key={gap.skill} className={styles.detailItem}>
        <p className={styles.detailTitle}>
          {gap.skill}{" "}
          <span
            className={`${styles.importanceBadge} ${gap.importance === "required" ? styles.required : styles.preferred
              }`}
          >
            {gap.importance}
          </span>
        </p>
        <p className={styles.detailBody}>{gap.note}</p>
        {gap.jobDescriptionEvidence && (
          <blockquote className={styles.quote}>{gap.jobDescriptionEvidence}</blockquote>
        )}
      </li>
    );

    return (
      <section className={styles.panel} aria-live="polite">
        <div className={styles.resultView}>
          <h2 className={styles.heading}>Result</h2>
          <div className={styles.resultContent}>
            <section className={styles.scoreCard} aria-label="Overall fit score">
              <div className={styles.scoreHeader}>
                <span className={styles.fitLabel}>Overall fit</span>
                <span className={`${styles.rating} ${scoreClass}`}>
                  {result.overallFit.rating}
                </span>
              </div>
              <p className={styles.scoreNumber}>
                {score}
                <span>/100</span>
              </p>
              <div
                className={styles.scoreTrack}
                role="progressbar"
                aria-label="Resume match score"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={score}
              >
                <div
                  className={`${styles.scoreProgress} ${scoreClass}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className={styles.fitText}>{result.overallFit.summary}</p>
            </section>
         
            <section className={styles.resultSection}>
              <h3 className={styles.sectionHeading}>Score breakdown</h3>
              <ul className={styles.breakdownList}>
                {CATEGORY_LABELS.map(({ key, label }) => {
                  const value = clampScore(result.categoryScores[key]);
                  return (
                    <li key={key} className={styles.breakdownRow}>
                      <span className={styles.breakdownLabel}>{label}</span>
                      <div
                        className={styles.miniTrack}
                        role="progressbar"
                        aria-label={`${label} score`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={value}
                      >
                        <div
                          className={`${styles.scoreProgress} ${ratingClass(value)}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className={styles.breakdownValue}>{value}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

           
            <section className={styles.resultSection}>
              <h3 className={styles.sectionHeading}>Keywords</h3>
              {matchedKeywords.length === 0 && missingKeywords.length === 0 ? (
                <p className={styles.emptyNote}>
                  {emptyReasons.missingKeywords ??
                    "No recognizable skills or tools were found in this job description."}
                </p>
              ) : (
                <>
                  {matchedKeywords.length > 0 && (
                    <>
                      <p className={styles.subLabel}>In your resume</p>
                      <ul className={styles.tagList}>
                        {matchedKeywords.map((keyword) => (
                          <li key={keyword} className={`${styles.tag} ${styles.tagMatched}`}>
                            {keyword}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className={styles.subLabel}>Missing from your resume</p>
                  {missingKeywords.length === 0 ? (
                    <p className={styles.emptyNote}>
                      {emptyReasons.missingKeywords ??
                        "Your resume covers every skill this posting lists."}
                    </p>
                  ) : (
                    <ul className={styles.tagList}>
                      {missingKeywords.map((keyword) => {
                        const importance = importanceBySkill.get(keyword);
                        return (
                          <li key={keyword} className={`${styles.tag} ${styles.tagMissing}`}>
                            {keyword}
                            {importance && (
                              <span className={styles.tagImportance}>{importance}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </section>

            <section className={styles.resultSection}>
              <h3 className={styles.sectionHeading}>Skill gaps</h3>
              {skillGaps.length === 0 ? (
                <p className={styles.emptyNote}>
                  {emptyReasons.skillGaps ?? "Your resume covers every skill this posting lists."}
                </p>
              ) : (
                <>
                  {requiredGaps.length > 0 && (
                    <ul className={styles.detailList}>{requiredGaps.map(renderGap)}</ul>
                  )}
                  {preferredGaps.length > 0 && (
                    <details className={styles.moreGaps} open={requiredGaps.length === 0}>
                      <summary>
                        {preferredGaps.length} preferred skill
                        {preferredGaps.length === 1 ? "" : "s"}
                      </summary>
                      <ul className={styles.detailList}>{preferredGaps.map(renderGap)}</ul>
                    </details>
                  )}
                </>
              )}
            </section>

            <section className={styles.resultSection}>
              <h3 className={styles.sectionHeading}>Strengths</h3>
              {strengths.length === 0 ? (
                <p className={styles.emptyNote}>
                  No strengths could be confirmed with a quote from your resume.
                </p>
              ) : (
                <ul className={styles.detailList}>
                  {strengths.map((strength) => (
                    <li key={strength.evidence} className={styles.detailItem}>
                      <p className={styles.detailBody}>{strength.point}</p>
                      <blockquote className={styles.quote}>{strength.evidence}</blockquote>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.resultSection}>
              <h3 className={styles.sectionHeading}>Suggested rewordings</h3>
              {rewordings.length === 0 ? (
                <p className={styles.emptyNote}>
                  {emptyReasons.suggestedRewordings ??
                    "Your resume lines already fit this posting well."}
                </p>
              ) : (
                <ul className={styles.detailList}>
                  {rewordings.map((item, index) => (
                    <li key={item.original} className={styles.detailItem}>
                      <p className={styles.detailBody}>
                        <span className={styles.rewordLabel}>Original:</span>{" "}
                        {item.original}
                      </p>
                      <p className={styles.detailBody}>
                        <span className={styles.rewordLabel}>Suggested:</span>{" "}
                        {item.suggested}
                      </p>
                      <p className={styles.detailBody}>
                        <span className={styles.rewordLabel}>Reason:</span>{" "}
                        {item.reason}
                      </p>
                      <button
                        type="button"
                        className={styles.copyButton}
                        onClick={() => void handleCopy(item.suggested, index)}
                      >
                        {copiedIndex === index ? "Copied" : "Copy"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {actionItems.length > 0 && (
              <section className={styles.resultSection}>
                <h3 className={styles.sectionHeading}>Action items</h3>
                <ul className={styles.checklist}>
                  {actionItems.map((item, index) => (
                    <li key={item}>
                      <label className={styles.checkItem}>
                        <input
                          type="checkbox"
                          checked={checkedItems.has(index)}
                          onChange={() => toggleItem(index)}
                        />
                        <span className={checkedItems.has(index) ? styles.checkedText : undefined}>
                          {item}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={handleEdit}
          >
            Edit job description
          </button>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.panel} aria-live="polite">
        <div className={styles.resultView}>
          <h2 className={styles.heading}>Analysis failed</h2>
          <p className={styles.errorMessage}>{error}</p>
          <div className={styles.buttonRow}>
            <button
              className={styles.analyzeButton}
              type="button"
              onClick={() => void runAnalysis()}
              disabled={isLoading}
            >
              {isLoading ? "Analyzing..." : "Retry"}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={handleEdit}
              disabled={isLoading}
            >
              Edit job description
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-live="polite">
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.heading} htmlFor="job-description">
          Job Description
        </label>
        <textarea
          className={styles.textarea}
          id="job-description"
          name="job-description"
          placeholder="Paste a job description here..."
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          required
          disabled={isLoading}
        />
        <button
          className={styles.analyzeButton}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </form>
    </section>
  );
}
