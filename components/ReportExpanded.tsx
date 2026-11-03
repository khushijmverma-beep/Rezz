"use client";

import { useEffect, useRef, useState } from "react";
import type { CheckStatus, JobMatchResult, ScoreSection } from "@/lib/types/job-match";
import styles from "./AnalyzePanel.module.css";

type Tab = "overview" | "ats" | "recruiter" | "keywords" | "rewordings";

const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "ats", label: "ATS" },
    { id: "recruiter", label: "Recruiter" },
    { id: "keywords", label: "Keywords" },
    { id: "rewordings", label: "Rewordings" },
];

const STATUS_LABEL: Record<CheckStatus, string> = { pass: "Pass", warn: "Warning", fail: "Fail" };
const STATUS_CLASS: Record<CheckStatus, string> = {
    pass: styles.statusPass,
    warn: styles.statusWarn,
    fail: styles.statusFail,
};

const NO_SCORES = "ATS and recruiter scores aren't available for this analysis yet.";

function CheckList({ section }: { section: ScoreSection }) {
    return (
        <ul className={styles.checkList}>
            {section.checks.map((check) => (
                <li key={check.id} className={styles.checkRow}>
                    <div className={styles.checkHeader}>
                        <span className={`${styles.statusBadge} ${STATUS_CLASS[check.status]}`}>
                            {STATUS_LABEL[check.status]}
                        </span>
                        <span className={styles.checkLabel}>{check.label}</span>
                        {check.maxPoints > 0 && (
                            <span className={styles.checkPoints}>
                                {check.points}/{check.maxPoints}
                            </span>
                        )}
                    </div>
                    <p className={styles.detailBody}>{check.reason}</p>
                    {check.evidence && <blockquote className={styles.quote}>{check.evidence}</blockquote>}
                </li>
            ))}
        </ul>
    );
}

type ReportExpandedProps = {
    result: JobMatchResult;
    onClose: () => void;
};

export default function ReportExpanded({ result, onClose }: ReportExpandedProps) {
    const [tab, setTab] = useState<Tab>("overview");
    const closeButton = useRef<HTMLButtonElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    // Escape closes, focus starts on Close, and the page behind can't scroll.
    useEffect(() => {
        closeButton.current?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onCloseRef.current();
        };
        document.addEventListener("keydown", onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    const topFixes = result.topFixes ?? [];
    const rewordings = result.suggestedRewordings ?? [];
    const skillGaps = result.skillGaps ?? [];

    return (
        <div
            className={styles.backdrop}
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="report-title">
                <div className={styles.modalHeader}>
                    <h2 id="report-title" className={styles.heading}>
                        Full report
                    </h2>
                    <button ref={closeButton} type="button" className={styles.secondaryButton} onClick={onClose}>
                        Close
                    </button>
                </div>

                <div className={styles.tabList} role="tablist" aria-label="Report sections">
                    {TABS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            id={`tab-${id}`}
                            aria-selected={tab === id}
                            aria-controls={`panel-${id}`}
                            className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
                            onClick={() => setTab(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div
                    className={styles.tabPanel}
                    role="tabpanel"
                    id={`panel-${tab}`}
                    aria-labelledby={`tab-${tab}`}
                >
                    {tab === "overview" && (
                        <>
                            {result.ats && result.human ? (
                                <div className={styles.scoreTiles}>
                                    <div className={styles.scoreTile}>
                                        <span className={styles.fitLabel}>ATS score</span>
                                        <p className={styles.scoreNumber}>
                                            {result.ats.score}
                                            <span>/100</span>
                                        </p>
                                    </div>
                                    <div className={styles.scoreTile}>
                                        <span className={styles.fitLabel}>Recruiter score</span>
                                        <p className={styles.scoreNumber}>
                                            {result.human.score}
                                            <span>/100</span>
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className={styles.emptyNote}>{NO_SCORES}</p>
                            )}
                            {result.overallFit.summary && <p className={styles.fitText}>{result.overallFit.summary}</p>}
                            {result.ats && result.human && (
                                <>
                                    <h3 className={styles.sectionHeading}>Top fixes</h3>
                                    {topFixes.length === 0 ? (
                                        <p className={styles.emptyNote}>
                                            No fixes to suggest. Every check passed or couldn&apos;t gain more points.
                                        </p>
                                    ) : (
                                        <ol className={styles.fixList}>
                                            {topFixes.map((fix) => (
                                                <li key={fix.text}>{fix.text}</li>
                                            ))}
                                        </ol>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {tab === "ats" &&
                        (result.ats ? (
                            <CheckList section={result.ats} />
                        ) : (
                            <p className={styles.emptyNote}>{NO_SCORES}</p>
                        ))}

                    {tab === "recruiter" &&
                        (result.human ? (
                            <CheckList section={result.human} />
                        ) : (
                            <p className={styles.emptyNote}>{NO_SCORES}</p>
                        ))}

                    {tab === "keywords" && (
                        <>
                            <p className={styles.subLabel}>In your resume</p>
                            {result.matchedKeywords.length === 0 ? (
                                <p className={styles.emptyNote}>None of the posting&apos;s skills were found.</p>
                            ) : (
                                <ul className={styles.tagList}>
                                    {result.matchedKeywords.map((k) => (
                                        <li key={k} className={`${styles.tag} ${styles.tagMatched}`}>
                                            {k}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <h3 className={styles.sectionHeading}>Skill gaps</h3>
                            {skillGaps.length === 0 ? (
                                <p className={styles.emptyNote}>
                                    {result.emptyReasons.skillGaps ?? "Your resume covers every skill this posting lists."}
                                </p>
                            ) : (
                                <ul className={styles.detailList}>
                                    {skillGaps.map((gap) => (
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
                                    ))}
                                </ul>
                            )}
                        </>
                    )}

                    {tab === "rewordings" &&
                        (rewordings.length === 0 ? (
                            <p className={styles.emptyNote}>
                                {result.emptyReasons.suggestedRewordings ??
                                    "No safe rewordings found for this job description."}
                            </p>
                        ) : (
                            <ul className={styles.detailList}>
                                {rewordings.map((item) => (
                                    <li key={item.original} className={styles.detailItem}>
                                        <p className={styles.detailBody}>
                                            <span className={styles.rewordLabel}>Original:</span> {item.original}
                                        </p>
                                        <p className={styles.detailBody}>
                                            <span className={styles.rewordLabel}>Suggested:</span> {item.suggested}
                                        </p>
                                        <p className={styles.detailBody}>
                                            <span className={styles.rewordLabel}>Reason:</span> {item.reason}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ))}
                </div>
            </div>
        </div>
    );
}