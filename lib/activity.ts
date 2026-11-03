

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  where,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export type ActivityType =
  | "edit"
  | "export"
  | "analysis"
  | "create";

export type ActivityDay = {
  date: string;
  edits: number;
  exports: number;
  analyses: number;
  creates: number;
};

export type UserRating =
  | "too_high"
  | "about_right"
  | "too_low";

export type SavedAnalysis = {
  id: string;
  draftId: string;
  draftTitle: string;
  resumeId: string;
  matchScore: number;
  rating: string;
  createdAt: number;
  atsScore?: number;
  humanScore?: number;
  templateId?: string;
  scorerVersion?: string;
  jobTitle?: string;
  userRating?: UserRating;
  userNote?: string;
};

export type SaveAnalysisInput = {
  draftId: string;
  draftTitle: string;
  matchScore: number;
  rating: string;
  resumeId?: string;
  atsScore?: number;
  humanScore?: number;
  templateId?: string;
  scorerVersion?: string;
  jobTitle?: string;
  jobDescription?: string;
};

const lastEdits = new Map<string, number>();

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function activityTotal(day: ActivityDay): number {
  return day.edits + day.exports + day.analyses + day.creates;
}

/**
 * An analysis document proves a scan occurred even if the separate
 * activityDays counter failed to write. Reconcile scan counts for the UI;
 * this does not change Firestore or invent edit/export activity.
 */
export function reconcileActivityDays(
  days: ActivityDay[],
  scans: SavedAnalysis[]
): { days: ActivityDay[]; repairedDates: string[] } {
  const today = new Date();
  const first = new Date(today);
  first.setDate(today.getDate() - 364);
  const earliest = localDateKey(first);
  const latest = localDateKey(today);

  const byDate = new Map<string, ActivityDay>();
  for (const day of days) {
    byDate.set(day.date, { ...day });
  }

  const scansPerDay = new Map<string, number>();
  for (const scan of scans) {
    if (!Number.isFinite(scan.createdAt) || scan.createdAt <= 0) continue;
    const date = localDateKey(new Date(scan.createdAt));
    if (date < earliest || date > latest) continue;
    scansPerDay.set(date, (scansPerDay.get(date) ?? 0) + 1);
  }

  const repairedDates: string[] = [];
  for (const [date, count] of scansPerDay) {
    const current = byDate.get(date) ?? {
      date,
      edits: 0,
      exports: 0,
      analyses: 0,
      creates: 0,
    };
    if (current.analyses < count) {
      repairedDates.push(date);
      current.analyses = count;
    }
    byDate.set(date, current);
  }

  return {
    days: [...byDate.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
    repairedDates: repairedDates.sort(),
  };
}

export async function logActivity(
  uid: string,
  type: ActivityType
): Promise<void> {
  const date = localDateKey();
  const key = `${uid}:${date}`;
  const now = Date.now();

  if (type === "edit") {
    const last = lastEdits.get(key);

    if (last !== undefined && now - last < 60_000) {
      return;
    }

    lastEdits.set(key, now);
  }

  try {
    const fields: Record<ActivityType, string> = {
      edit: "edits",
      export: "exports",
      analysis: "analyses",
      create: "creates",
    };

    await setDoc(
      doc(db, "users", uid, "activityDays", date),
      {
        date,
        [fields[type]]: increment(1),
      },
      { merge: true }
    );
  } catch (error) {
    if (type === "edit") {
      lastEdits.delete(key);
    }

    console.error("Activity logging failed:", error);
  }
}

export async function saveAnalysis(
  uid: string,
  data: SaveAnalysisInput
): Promise<string> {
  const title =
    data.jobTitle?.trim() ||
    data.jobDescription?.split(/\r?\n/).find(
      (line) => line.trim().length > 0
    )?.trim().slice(0, 120) ||
    "";

  const record = {
    draftId: data.draftId,
    draftTitle: data.draftTitle,
    resumeId: data.resumeId || data.draftId,
    matchScore: data.matchScore,
    rating: data.rating,
    createdAt: serverTimestamp(),
    ...(data.atsScore !== undefined && {
      atsScore: data.atsScore,
    }),
    ...(data.humanScore !== undefined && {
      humanScore: data.humanScore,
    }),
    ...(data.templateId && {
      templateId: data.templateId,
    }),
    ...(data.scorerVersion && {
      scorerVersion: data.scorerVersion,
    }),
    ...(title && { jobTitle: title }),
  };

  const ref = await addDoc(
    collection(db, "users", uid, "analyses"),
    record
  );

  // Avoid logging this same analysis again in the editor.
  await logActivity(uid, "analysis");

  return ref.id;
}

export async function updateAnalysisFeedback(
  uid: string,
  analysisId: string,
  userRating: UserRating,
  userNote = ""
): Promise<void> {
  await updateDoc(
    doc(db, "users", uid, "analyses", analysisId),
    {
      userRating,
      userNote: userNote.trim(),
    }
  );
}

export async function getActivityDays(
  uid: string
): Promise<ActivityDay[]> {
  const today = new Date();
  const first = new Date(today);
  first.setDate(today.getDate() - 364);

  const result = await getDocs(
    query(
      collection(db, "users", uid, "activityDays"),
      where("date", ">=", localDateKey(first)),
      where("date", "<=", localDateKey(today)),
      orderBy("date", "asc")
    )
  );

  return result.docs.map((snapshot) => {
    const value = snapshot.data();

    return {
      date: value.date ?? snapshot.id,
      edits: value.edits ?? 0,
      exports: value.exports ?? 0,
      analyses: value.analyses ?? 0,
      creates: value.creates ?? 0,
    };
  });
}

export async function getAnalyses(
  uid: string
): Promise<SavedAnalysis[]> {
  // No 50-scan limit: CSV export needs complete history.
  const result = await getDocs(
    query(
      collection(db, "users", uid, "analyses"),
      orderBy("createdAt", "asc")
    )
  );

  return result.docs.map((snapshot) => {
    const value = snapshot.data();

    const optionalScore = (
      score: unknown
    ): number | undefined =>
      typeof score === "number" && Number.isFinite(score)
        ? score
        : undefined;

    return {
      id: snapshot.id,
      draftId: value.draftId ?? value.resumeId ?? "",
      draftTitle: value.draftTitle ?? "",
      resumeId: value.resumeId ?? value.draftId ?? "",
      matchScore: value.matchScore ?? 0,
      rating: value.rating ?? "",
      createdAt:
        value.createdAt instanceof Timestamp
          ? value.createdAt.toMillis()
          : typeof value.createdAt === "number"
            ? value.createdAt
            : 0,
      atsScore: optionalScore(value.atsScore),
      humanScore: optionalScore(value.humanScore),
      templateId: value.templateId,
      scorerVersion: value.scorerVersion,
      jobTitle: value.jobTitle,
      userRating: value.userRating,
      userNote: value.userNote,
    };
  });
}
