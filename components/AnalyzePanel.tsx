"use client";

import { useState, type FormEvent } from "react";
import type { JobMatchResult } from "@/lib/types/job-match";
import styles from "./AnalyzePanel.module.css";

type AnalyzePanelProps = {
  resumeText: string;
};

export default function AnalyzePanel({ resumeText }: AnalyzePanelProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobMatchResult | null>(null);

  async function runAnalysis() {
    setIsLoading(true);
    setError(null);
    setResult(null);

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

      setResult(data as JobMatchResult);
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

  if (result) {
    return (
      <section className={styles.panel} aria-live="polite">
        <div className={styles.resultView}>
          <h2 className={styles.heading}>Result</h2>
          <div className={styles.resultContent}>
            <div className={styles.fitSummary}>
              <p className={styles.fitRating}>
                <span className={styles.fitLabel}>Overall fit</span>
                <strong>{result.overallFit.rating}</strong>
                <span className={styles.fitScore}>
                  {result.overallFit.matchScore}/100
                </span>
              </p>
              <p className={styles.fitText}>{result.overallFit.summary}</p>
            </div>

            <section className={styles.resultSection}>
              <h3 className={styles.sectionHeading}>Missing keywords</h3>
              {result.missingKeywords.length === 0 ? (
                <p className={styles.emptyNote}>None found.</p>
              ) : (
                <ul className={styles.tagList}>
                  {result.missingKeywords.map((keyword) => (
                    <li key={keyword} className={styles.tag}>
                      {keyword}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.resultSection}>
              <h3 className={styles.sectionHeading}>Skill gaps</h3>
              {result.skillGaps.length === 0 ? (
                <p className={styles.emptyNote}>None found.</p>
              ) : (
                <ul className={styles.detailList}>
                  {result.skillGaps.map((gap) => (
                    <li key={`${gap.skill}-${gap.importance}`} className={styles.detailItem}>
                      <p className={styles.detailTitle}>
                        {gap.skill}{" "}
                        <span className={styles.importance}>({gap.importance})</span>
                      </p>
                      <p className={styles.detailBody}>{gap.note}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.resultSection}>
              <h3 className={styles.sectionHeading}>Suggested rewordings</h3>
              {result.suggestedRewordings.length === 0 ? (
                <p className={styles.emptyNote}>None found.</p>
              ) : (
                <ul className={styles.detailList}>
                  {result.suggestedRewordings.map((item) => (
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
                    </li>
                  ))}
                </ul>
              )}
            </section>
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
