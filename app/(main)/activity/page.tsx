
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { listDrafts } from "@/lib/drafts";

import {
  getActivityDays,
  getAnalyses,
  type ActivityDay,
  type SavedAnalysis,
} from "@/lib/activity";

import ActivityHeatmap from "@/components/ActivityHeatmap";
import ScoreChart from "@/components/ScoreChart";

// Convert a date to YYYY-MM-DD
function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Calculate consecutive active days
function calculateStreak(days: ActivityDay[]): number {
  const activeDates = new Set(
    days
      .filter(
        (day) =>
          day.edits +
            day.exports +
            day.analyses +
            day.creates > 0
      )
      .map((day) => day.date)
  );

  const current = new Date();
  current.setHours(0, 0, 0, 0);

  if (!activeDates.has(dateKey(current))) {
    current.setDate(current.getDate() - 1);
  }

  let streak = 0;

  while (activeDates.has(dateKey(current))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

// Calculate edits since Monday
function calculateWeeklyEdits(
  days: ActivityDay[]
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const dayOfWeek = (today.getDay() + 6) % 7;

  monday.setDate(today.getDate() - dayOfWeek);

  const start = dateKey(monday);
  const end = dateKey(today);

  return days
    .filter(
      (day) => day.date >= start && day.date <= end
    )
    .reduce((total, day) => total + day.edits, 0);
}

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid;

  const [days, setDays] = useState<ActivityDay[]>([]);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [resumeCount, setResumeCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load activity from Firebase
  useEffect(() => {
    if (authLoading || !uid) return;

    let cancelled = false;
    const userId = uid;

    async function loadActivity() {
      setLoading(true);
      setError(null);

      try {
        const [activityDays, savedAnalyses, drafts] =
          await Promise.all([
            getActivityDays(userId),
            getAnalyses(userId),
            listDrafts(userId),
          ]);

        if (cancelled) return;

        setDays(activityDays);
        setAnalyses(savedAnalyses);
        setResumeCount(drafts.length);
      } catch (err) {
        console.error("Failed to load activity:", err);

        if (!cancelled) {
          setError(
            "Could not load your activity. Please refresh."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadActivity();

    return () => {
      cancelled = true;
    };
  }, [uid, authLoading]);

  // Loading screen
  if (authLoading || (uid && loading)) {
    return (
      <div className="p-8 text-gray-500">
        Loading your activity...
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="p-8 text-gray-600">
        Please sign in to view your activity.
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="p-8 text-red-600">
        {error}
      </div>
    );
  }

  // Calculate statistics
  const weeklyEdits = calculateWeeklyEdits(days);
  const currentStreak = calculateStreak(days);

  const latestAnalysis =
    analyses.length > 0
      ? analyses[analyses.length - 1]
      : null;

  const cards = [
    {
      title: "Edits This Week",
      value: weeklyEdits.toString(),
      description: "Resume edits since Monday",
    },
    {
      title: "Current Streak",
      value: `${currentStreak} days`,
      description: "Consecutive active days",
    },
    {
      title: "Resumes Created",
      value: resumeCount.toString(),
      description: "Currently saved resumes",
    },
    {
      title: "Latest Match Score",
      value: latestAnalysis
        ? `${latestAnalysis.matchScore}%`
        : "N/A",
      description: "Most recent AI analysis",
    },
  ];

  const hasActivity =
    days.some(
      (day) =>
        day.edits +
          day.exports +
          day.analyses +
          day.creates > 0
    ) || analyses.length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">

      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Activity
        </h1>

        <p className="mt-2 text-gray-500">
          Track your resume progress and AI match scores.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <p className="text-sm font-medium text-gray-500">
              {card.title}
            </p>

            <p className="mt-3 text-3xl font-bold text-gray-900">
              {card.value}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!hasActivity && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="font-medium text-gray-900">
            No activity yet.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Edit a resume and it will show up here.
          </p>
        </div>
      )}

      {/* Activity heatmap */}
      <ActivityHeatmap days={days} />

      {/* AI match score graph */}
      <ScoreChart analyses={analyses} />

    </div>
  );
}

