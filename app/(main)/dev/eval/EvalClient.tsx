"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getAnalyses, type SavedAnalysis } from "@/lib/activity";
import { useAuth } from "@/lib/useAuth";

export type EvalRow = {
  id: string;
  humanAts: number;
  humanRecruiter: number;
  predictedAts: number;
  predictedRecruiter: number;
  atsError: number;
  recruiterError: number;
  version: string;
  notes: string;
};

type Props = {
  rows: EvalRow[];
  errors: string[];
  version: string;
};

type Metrics = {
  atsMAE: number | null;
  recruiterMAE: number | null;
  atsSpearman: number | null;
  recruiterSpearman: number | null;
};

type PreviousRun = {
  version: string;
  metrics: Metrics;
  count: number;
};

type FeedbackSummary = {
  scorerVersion: string;
  tooHigh: number;
  aboutRight: number;
  tooLow: number;
};

const LAST_RUN_KEY = "rezz-eval-last-run";
let savedRun: string | null | undefined;
const noSubscribe = () => () => {};

function readSavedRun(): string | null {
  if (savedRun === undefined) {
    savedRun = localStorage.getItem(LAST_RUN_KEY);
  }
  return savedRun;
}

function mean(values: number[]): number | null {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

// Average ranks for tied values, e.g. [10, 10, 20] -> [1.5, 1.5, 3].
function ranks(values: number[]): number[] {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);

  const result = Array<number>(values.length);
  let i = 0;

  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && sorted[j].value === sorted[i].value) {
      j++;
    }
    const rank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) result[sorted[k].index] = rank;
    i = j;
  }
  return result;
}

// Spearman correlation = Pearson correlation of ranked values.
function spearman(predicted: number[], human: number[]): number | null {
  if (predicted.length < 2 || predicted.length !== human.length) return null;

  const x = ranks(predicted);
  const y = ranks(human);
  const mx = mean(x)!;
  const my = mean(y)!;
  let numerator = 0;
  let sumX = 0;
  let sumY = 0;

  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    numerator += dx * dy;
    sumX += dx * dx;
    sumY += dy * dy;
  }

  const denominator = Math.sqrt(sumX * sumY);
  return denominator === 0 ? null : numerator / denominator;
}

function calculateMetrics(rows: EvalRow[]): Metrics {
  return {
    atsMAE: mean(rows.map((row) => row.atsError)),
    recruiterMAE: mean(rows.map((row) => row.recruiterError)),
    atsSpearman: spearman(
      rows.map((row) => row.predictedAts),
      rows.map((row) => row.humanAts)
    ),
    recruiterSpearman: spearman(
      rows.map((row) => row.predictedRecruiter),
      rows.map((row) => row.humanRecruiter)
    ),
  };
}

function display(value: number | null): string {
  return value === null ? "N/A" : value.toFixed(3);
}

function summarizeFeedback(analyses: SavedAnalysis[]): FeedbackSummary[] {
  const summary = new Map<string, FeedbackSummary>();
  for (const analysis of analyses) {
    // This matches UserRating from lib/activity.ts.
    const rating = analysis.userRating;
    if (rating !== "too_high" && rating !== "about_right" && rating !== "too_low") {
      continue;
    }
    const version = analysis.scorerVersion || "Unknown";
    let group = summary.get(version);
    if (!group) {
      group = { scorerVersion: version, tooHigh: 0, aboutRight: 0, tooLow: 0 };
      summary.set(version, group);
    }
    if (rating === "too_high") group.tooHigh++;
    if (rating === "about_right") group.aboutRight++;
    if (rating === "too_low") group.tooLow++;
  }
  return [...summary.values()].sort((a, b) =>
    a.scorerVersion.localeCompare(b.scorerVersion)
  );
}

export default function EvalClient({ rows, errors, version }: Props) {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;
  const [feedbackAnalyses, setFeedbackAnalyses] = useState<SavedAnalysis[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackRefresh, setFeedbackRefresh] = useState(0);


useEffect(() => {
  if (authLoading) return;

  let cancelled = false;

  // Schedule the state updates asynchronously.
  void Promise.resolve().then(async () => {
    if (cancelled) return;

    if (!uid) {
      setFeedbackAnalyses([]);
      setFeedbackError(null);
      setFeedbackLoading(false);
      return;
    }

    setFeedbackAnalyses([]);
    setFeedbackError(null);
    setFeedbackLoading(true);

    try {
      const analyses = await getAnalyses(uid);

      if (cancelled) return;

      setFeedbackAnalyses(analyses);
      setFeedbackError(null);
    } catch (error: unknown) {
      console.error(
        "Unable to load evaluation feedback:",
        error
      );

      if (cancelled) return;

      setFeedbackError(
        "Unable to read feedback from Firestore."
      );
    } finally {
      if (!cancelled) {
        setFeedbackLoading(false);
      }
    }
  });

  return () => {
    cancelled = true;
  };
}, [authLoading, uid, feedbackRefresh]);


  const feedbackSummary = useMemo(
    () => summarizeFeedback(feedbackAnalyses),
    [feedbackAnalyses]
  );
  const metrics = useMemo(() => calculateMetrics(rows), [rows]);
  const topDisagreements = useMemo(
    () =>
      [...rows]
        .sort(
          (a, b) =>
            b.atsError + b.recruiterError - (a.atsError + a.recruiterError)
        )
        .slice(0, 5),
    [rows]
  );

  const saved = useSyncExternalStore(noSubscribe, readSavedRun, () => null);
  const previous = useMemo(() => {
    if (!saved) return null;
    try {
      return JSON.parse(saved) as PreviousRun;
    } catch {
      return null;
    }
  }, [saved]);

  useEffect(() => {
    readSavedRun();
    if (rows.length && errors.length === 0) {
      localStorage.setItem(
        LAST_RUN_KEY,
        JSON.stringify({ version, metrics, count: rows.length } satisfies PreviousRun)
      );
    }
  }, [version, metrics, rows.length, errors.length]);

  const cards = [
    { name: "ATS Mean Absolute Error", value: metrics.atsMAE, description: "Lower is better" },
    { name: "Recruiter Mean Absolute Error", value: metrics.recruiterMAE, description: "Lower is better" },
    { name: "ATS Spearman Correlation", value: metrics.atsSpearman, description: "Closer to +1 is better" },
    { name: "Recruiter Spearman Correlation", value: metrics.recruiterSpearman, description: "Closer to +1 is better" },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-7 p-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Scorer Evaluation</h1>
        <p className="mt-2 text-gray-500">Compare automated resume scores with human ratings.</p>
        <p className="mt-3 text-sm text-gray-600">
          Scorer version: <strong>{version}</strong> | Evaluated pairs: <strong>{rows.length}</strong>
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Human labels use a 1–5 scale. Predicted 0–100 scores are converted to 1–5 for error calculations.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <section key={card.name} className="rounded-xl border bg-white p-5">
            <h2 className="text-sm text-gray-500">{card.name}</h2>
            <p className="mt-3 text-3xl font-bold">{display(card.value)}</p>
            <p className="mt-2 text-xs text-gray-500">{card.description}</p>
          </section>
        ))}
      </div>

      {previous && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Previous Run Comparison</h2>
          <p className="mt-2 text-sm text-gray-500">
            Previous version: {previous.version} | Previous pairs: {previous.count}
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b"><th className="p-3">Metric</th><th className="p-3">Previous</th><th className="p-3">Current</th></tr></thead>
              <tbody>
                {([
                  ["ATS MAE", "atsMAE"],
                  ["Recruiter MAE", "recruiterMAE"],
                  ["ATS Spearman", "atsSpearman"],
                  ["Recruiter Spearman", "recruiterSpearman"],
                ] as const).map(([name, key]) => (
                  <tr key={key} className="border-b">
                    <td className="p-3">{name}</td>
                    <td className="p-3">{display(previous.metrics[key])}</td>
                    <td className="p-3">{display(metrics[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Largest Scoring Disagreements</h2>
        <p className="mt-2 text-sm text-gray-500">The five pairs with the largest combined ATS and Recruiter error.</p>
        {!topDisagreements.length ? (
          <p className="mt-4 text-gray-500">No valid evaluation results yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Pair</th><th className="p-3">ATS Pred.</th>
                  <th className="p-3">ATS Human</th><th className="p-3">Recruiter Pred.</th>
                  <th className="p-3">Recruiter Human</th><th className="p-3">Total Error</th>
                </tr>
              </thead>
              <tbody>
                {topDisagreements.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3"><strong>{row.id}</strong><p className="text-xs text-gray-500">{row.notes}</p></td>
                    <td className="p-3">{row.predictedAts.toFixed(1)}/100</td>
                    <td className="p-3">{row.humanAts}/5</td>
                    <td className="p-3">{row.predictedRecruiter.toFixed(1)}/100</td>
                    <td className="p-3">{row.humanRecruiter}/5</td>
                    <td className="p-3 font-semibold">{(row.atsError + row.recruiterError).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Was This Fair? Feedback</h2>
          {uid && (
            <button
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => {
                setFeedbackLoading(true);
                setFeedbackRefresh((value) => value + 1);
              }}
            >
              Refresh feedback
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">Ratings saved on analyses for the currently signed-in user, grouped by scorer version.</p>
        {authLoading || (uid && feedbackLoading) ? (
          <p className="mt-4 text-sm text-gray-500">Loading feedback...</p>
        ) : !uid ? (
          <p className="mt-4 text-sm text-gray-500">Sign in to view saved feedback.</p>
        ) : feedbackError ? (
          <p className="mt-4 text-sm text-red-600">{feedbackError}</p>
        ) : feedbackSummary.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No saved feedback yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50"><tr><th className="p-3">Scorer version</th><th className="p-3">Too high</th><th className="p-3">About right</th><th className="p-3">Too low</th><th className="p-3">Total</th></tr></thead>
              <tbody>
                {feedbackSummary.map((group) => (
                  <tr key={group.scorerVersion} className="border-t">
                    <td className="p-3">{group.scorerVersion}</td>
                    <td className="p-3">{group.tooHigh}</td>
                    <td className="p-3">{group.aboutRight}</td>
                    <td className="p-3">{group.tooLow}</td>
                    <td className="p-3 font-semibold">{group.tooHigh + group.aboutRight + group.tooLow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {errors.length > 0 && (
        <section className="rounded-xl border border-red-200 p-5">
          <h2 className="font-semibold text-red-700">Evaluation Errors</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-red-600">
            {errors.map((error, index) => <li key={index}>{error}</li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
