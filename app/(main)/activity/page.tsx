
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { listDrafts, type Draft } from "@/lib/drafts";
import {
  getActivityDays,
  getAnalyses,
  activityTotal,
  localDateKey,
  type ActivityDay,
  type SavedAnalysis,
} from "@/lib/activity";

import ActivityHeatmap from "@/components/ActivityHeatmap";
import ScoreChart from "@/components/ScoreChart";
import ProgressCard from "@/components/ProgressCard";

function currentStreak(days: ActivityDay[]): number {
  const active = new Set(
    days.filter((day) => activityTotal(day) > 0).map((day) => day.date)
  );

  const day = new Date();
  day.setHours(0, 0, 0, 0);

  if (!active.has(localDateKey(day))) {
    day.setDate(day.getDate() - 1);
  }

  let streak = 0;

  while (active.has(localDateKey(day))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }

  return streak;
}

function startOfWeek(): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date.getTime();
}

function average(
  scans: SavedAnalysis[],
  key: "atsScore" | "humanScore"
): string {
  const values = scans
    .map((scan) => scan[key])
    .filter((value): value is number => value !== undefined);

  if (!values.length) return "N/A";

  return (
    Math.round(
      values.reduce((total, value) => total + value, 0) /
        values.length
    ) + "%"
  );
}

function bestImprovement(scans: SavedAnalysis[]): string {
  const groups = new Map<string, SavedAnalysis[]>();

  scans.forEach((scan) => {
    if (!scan.resumeId) return;
    const group = groups.get(scan.resumeId) ?? [];
    group.push(scan);
    groups.set(scan.resumeId, group);
  });

  const changes: number[] = [];

  groups.forEach((group) => {
    for (const key of ["atsScore", "humanScore"] as const) {
      const values = group
        .filter((scan) => scan[key] !== undefined)
        .sort((a, b) => a.createdAt - b.createdAt);

      if (values.length >= 2) {
        changes.push(
          values[values.length - 1][key]! - values[0][key]!
        );
      }
    }
  });

  if (!changes.length) return "N/A";

  const best = Math.max(...changes);
  return `${best > 0 ? "+" : ""}${best} pts`;
}

function exportCsv(scans: SavedAnalysis[]) {
  const columns = [
    "Date",
    "Resume Title",
    "Job Title",
    "ATS Score",
    "Recruiter Score",
    "User Rating",
    "Scorer Version",
  ];

  function cell(value: string | number | undefined): string {
    const text = String(value ?? "");
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }

  const rows = scans.map((scan) =>
    [
      scan.createdAt
        ? new Date(scan.createdAt).toISOString()
        : "",
      scan.draftTitle,
      scan.jobTitle ?? "",
      scan.atsScore,
      scan.humanScore,
      scan.userRating ?? "",
      scan.scorerVersion ?? "",
    ]
      .map(cell)
      .join(",")
  );

  const csv = [columns.map(cell).join(","), ...rows].join("\r\n");

  const blob = new Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "rezz-activity.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;

  const [days, setDays] = useState<ActivityDay[]>([]);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!uid) {
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [activity, scans, resumes] = await Promise.all([
          getActivityDays(uid!),
          getAnalyses(uid!),
          listDrafts(uid!),
        ]);

        if (cancelled) return;

        setDays(activity);
        setAnalyses(scans);
        setDrafts(resumes);
      } catch (err) {
        console.error("Activity loading failed:", err);
        if (!cancelled) {
          setError("Unable to load your activity.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [uid, authLoading, refreshCount]);

  if (authLoading || (uid && loading)) {
    return <div className="p-8">Loading activity...</div>;
  }

  if (!user) {
    return <div className="p-8">Please sign in first.</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => setRefreshCount((count) => count + 1)}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const monday = startOfWeek();

  const weeklyEdits = days
    .filter((day) => day.date >= localDateKey(new Date(monday)))
    .reduce((sum, day) => sum + day.edits, 0);

  const weeklyScans = analyses.filter(
    (scan) => scan.createdAt >= monday
  ).length;

  const resumeOptions = new Map<string, string>();

  drafts.forEach((draft) => {
    resumeOptions.set(draft.id, draft.title);
  });

  analyses.forEach((scan) => {
    if (scan.resumeId && !resumeOptions.has(scan.resumeId)) {
      resumeOptions.set(
        scan.resumeId,
        scan.draftTitle || "Previous resume"
      );
    }
  });

  const options = Array.from(resumeOptions);
  const chosenResumeId = resumeOptions.has(selectedResumeId)
    ? selectedResumeId
    : (options[0]?.[0] ?? "");

  const selectedScans = analyses.filter(
    (scan) => scan.resumeId === chosenResumeId
  );

  const selectedTitle =
    resumeOptions.get(chosenResumeId) ?? "Resume";

  const cards = [
    {
      title: "Scans This Week",
      value: String(weeklyScans),
      description: "Analyses since Monday",
    },
    {
      title: "Best Improvement",
      value: bestImprovement(analyses),
      description: "Largest score gain",
    },
    {
      title: "Average ATS Score",
      value: average(analyses, "atsScore"),
      description: "Across all saved scans",
    },
    {
      title: "Average Recruiter Score",
      value: average(analyses, "humanScore"),
      description: "Across all saved scans",
    },
    {
      title: "Edits This Week",
      value: String(weeklyEdits),
      description: "Resume edits logged",
    },
    {
      title: "Current Streak",
      value: `${currentStreak(days)} days`,
      description: "Consecutive active days",
    },
    {
      title: "Saved Resumes",
      value: String(drafts.length),
      description: "Current resume drafts",
    },
    {
      title: "Total Scans",
      value: String(analyses.length),
      description: "All recorded analyses",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-7 px-6 pb-6 md:px-8 md:pb-8">
      <div>
        {/* Title on the left, buttons on the right, on one line. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="m-0! text-3xl font-bold text-gray-900">
            Activity
          </h1>

          {/* Same text size and padding as Home's Sort by dropdown. text-sm sits on
              the wrapper because globals.css sets `font: inherit` on buttons. */}
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setRefreshCount((count) => count + 1)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 hover:bg-gray-50"
            >
              Refresh
            </button>

            <button
              onClick={() => exportCsv(analyses)}
              disabled={analyses.length === 0}
              className="rounded-lg bg-gray-800 px-3 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Export My Activity (CSV)
            </button>
          </div>
        </div>
        <p className="mt-2 text-gray-500">
          Track resume activity and improvements over time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border bg-white p-5"
          >
            <p className="text-sm text-gray-500">{card.title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <ActivityHeatmap days={days} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Resume Progress
            </h2>
            <p className="text-sm text-gray-500">
              Select a resume to see its scan history.
            </p>
          </div>

          <select
            value={chosenResumeId}
            onChange={(event) =>
              setSelectedResumeId(event.target.value)
            }
            className="max-w-full rounded-lg border bg-white px-3 py-2"
          >
            {options.length === 0 && (
              <option value="">No resumes found</option>
            )}

            {options.map(([id, title]) => (
              <option value={id} key={id}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <ProgressCard analyses={selectedScans} />

        <ScoreChart analyses={selectedScans} />
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Scan History — {selectedTitle}
        </h2>

        {selectedScans.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No scans for this resume yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Job Title</th>
                  <th className="p-3">ATS</th>
                  <th className="p-3">Recruiter</th>
                  <th className="p-3">Version</th>
                </tr>
              </thead>
              <tbody>
                {[...selectedScans]
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((scan) => (
                    <tr key={scan.id} className="border-b">
                      <td className="p-3">
                        {scan.createdAt
                          ? new Date(
                              scan.createdAt
                            ).toLocaleDateString()
                          : "Unknown"}
                      </td>
                      <td className="p-3">
                        {scan.jobTitle || "Not specified"}
                      </td>
                      <td className="p-3">
                        {scan.atsScore ?? "N/A"}
                      </td>
                      <td className="p-3">
                        {scan.humanScore ?? "N/A"}
                      </td>
                      <td className="p-3">
                        {scan.scorerVersion || "Unknown"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

