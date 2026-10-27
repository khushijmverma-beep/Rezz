
"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

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

const LAST_RUN_KEY = "rezz-eval-last-run";

// Read the saved run once per page load, before this run overwrites it.
let savedRun: string | null | undefined;

function readSavedRun(): string | null {
  if (savedRun === undefined) {
    savedRun = localStorage.getItem(LAST_RUN_KEY);
  }
  return savedRun;
}

const noSubscribe = () => () => {};

function mean(values: number[]): number | null {
  if (values.length === 0) return null;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

// Gives tied values their average rank.
function ranks(values: number[]): number[] {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);

  const result = Array<number>(values.length);
  let i = 0;

  while (i < sorted.length) {
    let j = i + 1;

    while (
      j < sorted.length &&
      sorted[j].value === sorted[i].value
    ) {
      j++;
    }

    const rank = (i + 1 + j) / 2;

    for (let k = i; k < j; k++) {
      result[sorted[k].index] = rank;
    }

    i = j;
  }

  return result;
}

// Spearman = Pearson correlation of the ranks.
function spearman(
  predicted: number[],
  human: number[]
): number | null {
  if (predicted.length < 2) return null;

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

  return denominator === 0
    ? null
    : numerator / denominator;
}

function calculateMetrics(rows: EvalRow[]): Metrics {
  return {
    atsMAE: mean(rows.map((row) => row.atsError)),
    recruiterMAE: mean(
      rows.map((row) => row.recruiterError)
    ),
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

export default function EvalClient({
  rows,
  errors,
  version,
}: Props) {
  const metrics = useMemo(
    () => calculateMetrics(rows),
    [rows]
  );

  const saved = useSyncExternalStore(
    noSubscribe,
    readSavedRun,
    () => null
  );

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

    if (rows.length > 0 && errors.length === 0) {
      localStorage.setItem(
        LAST_RUN_KEY,
        JSON.stringify({
          version,
          metrics,
          count: rows.length,
        } satisfies PreviousRun)
      );
    }
  }, [version, metrics, rows.length, errors.length]);

  const cards = [
    {
      name: "ATS Mean Absolute Error",
      value: metrics.atsMAE,
      description: "Lower is better",
    },
    {
      name: "Recruiter Mean Absolute Error",
      value: metrics.recruiterMAE,
      description: "Lower is better",
    },
    {
      name: "ATS Spearman Correlation",
      value: metrics.atsSpearman,
      description: "Closer to +1 is better",
    },
    {
      name: "Recruiter Spearman Correlation",
      value: metrics.recruiterSpearman,
      description: "Closer to +1 is better",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-7 p-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          Scorer Evaluation
        </h1>

        <p className="mt-2 text-gray-500">
          Compare automated resume scores with human ratings.
        </p>

        <p className="mt-3 text-sm text-gray-600">
          Scorer version: <strong>{version}</strong>
          {" | "}
          Evaluated pairs: <strong>{rows.length}</strong>
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Human scores use a 1–5 scale. Predicted 0–100
          scores are converted to 1–5 for error calculations.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <section
            key={card.name}
            className="rounded-xl border bg-white p-5"
          >
            <h2 className="text-sm text-gray-500">
              {card.name}
            </h2>

            <p className="mt-3 text-3xl font-bold">
              {display(card.value)}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              {card.description}
            </p>
          </section>
        ))}
      </div>

      {previous && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-lg font-semibold">
            Previous Run Comparison
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Previous version: {previous.version}
            {" | "}
            Previous pairs: {previous.count}
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Metric</th>
                  <th className="p-3">Previous</th>
                  <th className="p-3">Current</th>
                </tr>
              </thead>

              <tbody>
                {(
                  [
                    ["ATS MAE", "atsMAE"],
                    ["Recruiter MAE", "recruiterMAE"],
                    ["ATS Spearman", "atsSpearman"],
                    ["Recruiter Spearman", "recruiterSpearman"],
                  ] as const
                ).map(([name, key]) => (
                  <tr key={key} className="border-b">
                    <td className="p-3">{name}</td>
                    <td className="p-3">
                      {display(previous.metrics[key])}
                    </td>
                    <td className="p-3">
                      {display(metrics[key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold">
          Largest Scoring Disagreements
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Ordered by total ATS and Recruiter score error.
        </p>

        {rows.length === 0 ? (
          <p className="mt-4 text-gray-500">
            No valid evaluation results yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Pair</th>
                  <th className="p-3">ATS Pred.</th>
                  <th className="p-3">ATS Human</th>
                  <th className="p-3">Recruiter Pred.</th>
                  <th className="p-3">Recruiter Human</th>
                  <th className="p-3">Total Error</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3">
                      <strong>{row.id}</strong>
                      <p className="text-xs text-gray-500">
                        {row.notes}
                      </p>
                    </td>
                    <td className="p-3">
                      {row.predictedAts.toFixed(1)}/100
                    </td>
                    <td className="p-3">
                      {row.humanAts}/5
                    </td>
                    <td className="p-3">
                      {row.predictedRecruiter.toFixed(1)}/100
                    </td>
                    <td className="p-3">
                      {row.humanRecruiter}/5
                    </td>
                    <td className="p-3 font-semibold">
                      {(
                        row.atsError + row.recruiterError
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {errors.length > 0 && (
        <section className="rounded-xl border border-red-200 p-5">
          <h2 className="font-semibold text-red-700">
            Evaluation Errors
          </h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-red-600">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
