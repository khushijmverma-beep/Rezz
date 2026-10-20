
import { db } from "@/lib/firebase";
import {
  doc,
  collection,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// ========================================
// TYPES
// ========================================

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

export type SavedAnalysis = {
  id: string;
  draftId: string;
  draftTitle: string;
  matchScore: number;
  rating: string;
  createdAt: number;
};

// Track the last edit logged for each user
const lastEditLog = new Map<string, number>();

// Get a date in YYYY-MM-DD using local time
function getLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ========================================
// 1. LOG ACTIVITY
// ========================================

export async function logActivity(
  uid: string,
  type: ActivityType
): Promise<void> {
  try {
    const now = Date.now();

    // Only log edits once per minute per user
    if (type === "edit") {
      const lastLog = lastEditLog.get(uid) ?? 0;

      if (now - lastLog < 60000) {
        return;
      }

      lastEditLog.set(uid, now);
    }

    const today = getLocalDate(new Date());

    // Match activity types to Firestore fields
    const fields = {
      edit: "edits",
      export: "exports",
      analysis: "analyses",
      create: "creates",
    } as const;

    const activityRef = doc(
      db,
      "users",
      uid,
      "activityDays",
      today
    );

    await setDoc(
      activityRef,
      {
        date: today,
        [fields[type]]: increment(1),
      },
      { merge: true }
    );
  } catch (error) {
    if (type === "edit") {
      lastEditLog.delete(uid);
    }

    console.error("Failed to log activity:", error);
  }
}

// ========================================
// 2. SAVE AI ANALYSIS
// ========================================

export async function saveAnalysis(
  uid: string,
  data: {
    draftId: string;
    draftTitle: string;
    matchScore: number;
    rating: string;
  }
): Promise<void> {
  try {
    const analysesRef = collection(
      db,
      "users",
      uid,
      "analyses"
    );

    await addDoc(analysesRef, {
      draftId: data.draftId,
      draftTitle: data.draftTitle,
      matchScore: data.matchScore,
      rating: data.rating,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to save analysis:", error);
  }
}

// ========================================
// 3. GET ACTIVITY DAYS
// ========================================

export async function getActivityDays(
  uid: string
): Promise<ActivityDay[]> {
  const today = new Date();

  // Start 364 days before today: 365 days total
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);

  const start = getLocalDate(startDate);
  const end = getLocalDate(today);

  const activityRef = collection(
    db,
    "users",
    uid,
    "activityDays"
  );

  const activityQuery = query(
    activityRef,
    where("date", ">=", start),
    where("date", "<=", end),
    orderBy("date", "asc")
  );

  const snapshot = await getDocs(activityQuery);

  return snapshot.docs.map((document) => {
    const data = document.data();

    return {
      date: data.date ?? document.id,
      edits: data.edits ?? 0,
      exports: data.exports ?? 0,
      analyses: data.analyses ?? 0,
      creates: data.creates ?? 0,
    };
  });
}

// ========================================
// 4. GET AI ANALYSES
// ========================================

export async function getAnalyses(
  uid: string
): Promise<SavedAnalysis[]> {
  const analysesRef = collection(
    db,
    "users",
    uid,
    "analyses"
  );

  const analysesQuery = query(
    analysesRef,
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const snapshot = await getDocs(analysesQuery);

  const analyses: SavedAnalysis[] = snapshot.docs.map(
    (document) => {
      const data = document.data();

      return {
        id: document.id,
        draftId: data.draftId ?? "",
        draftTitle: data.draftTitle ?? "",
        matchScore: data.matchScore ?? 0,
        rating: data.rating ?? "",
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toMillis()
            : 0,
      };
    }
  );

  // Return oldest first for the line chart
  return analyses.reverse();
}
