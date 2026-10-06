"use client";

import { useState, type FormEvent } from "react";
import styles from "./AnalyzePanel.module.css";

export default function AnalyzePanel() {
  const [jobDescription, setJobDescription] = useState("");
  const [showResult, setShowResult] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowResult(true);
  }

  return (
    <section className={styles.panel} aria-live="polite">
      {showResult ? (
        <div className={styles.resultView}>
          <h2 className={styles.heading}>Result</h2>
          <p className={styles.placeholder}>
            Your analysis will appear here.
          </p>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => setShowResult(false)}
          >
            Edit job description
          </button>
        </div>
      ) : (
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
          />
          <button className={styles.analyzeButton} type="submit">
            Analyze
          </button>
        </form>
      )}
    </section>
  );
}
