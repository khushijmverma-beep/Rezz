import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type { ResumeData } from "@/lib/types/resume";
import { db } from "@/lib/firebase";
import { normalizeDetails } from "@/lib/resumeDetails";

export type Draft = {
  id: string;
  title: string;
  templateId: string;
  targetRole?: string;
  data: ResumeData;
  createdAt: number;
  updatedAt: number;
};

export type CreateDraftInput = {
  title: string;
  templateId: string;
  targetRole?: string;
  data: ResumeData;
};

export type UpdateDraftInput = Partial<
  Pick<Draft, "title" | "templateId" | "targetRole" | "data">
>;

function toMillis(value: unknown, field: string): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (typeof value === "number") {
    return value;
  }

  throw new TypeError(`Draft ${field} must be a Firestore timestamp.`);
}

function toResumeData(value: unknown): ResumeData {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Draft data must be an object.");
  }

  return normalizeDetails(value);
}

function toDraft(id: string, value: Record<string, unknown>): Draft {
  const { title, templateId, targetRole } = value;

  if (typeof title !== "string" || typeof templateId !== "string") {
    throw new TypeError("Draft title and templateId must be strings.");
  }

  if (targetRole !== undefined && typeof targetRole !== "string") {
    throw new TypeError("Draft targetRole must be a string when provided.");
  }

  return {
    id,
    title,
    templateId,
    ...(targetRole === undefined ? {} : { targetRole }),
    data: toResumeData(value.data),
    createdAt: toMillis(value.createdAt, "createdAt"),
    updatedAt: toMillis(value.updatedAt, "updatedAt"),
  };
}

function draftsCollection(uid: string) {
  return collection(db, "users", uid, "drafts");
}

export async function createDraft(
  uid: string,
  draft: CreateDraftInput,
): Promise<string> {
  const draftRef = await addDoc(draftsCollection(uid), {
    ...draft,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return draftRef.id;
}

export async function getDraft(uid: string, id: string): Promise<Draft | null> {
  const snapshot = await getDoc(doc(db, "users", uid, "drafts", id));

  return snapshot.exists() ? toDraft(snapshot.id, snapshot.data()) : null;
}

export async function updateDraft(
  uid: string,
  id: string,
  partial: UpdateDraftInput,
): Promise<void> {
  const updates = Object.fromEntries(
    Object.entries(partial).filter(([, value]) => value !== undefined),
  );

  await updateDoc(doc(db, "users", uid, "drafts", id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function listDrafts(uid: string): Promise<Draft[]> {
  const draftsQuery = query(
    draftsCollection(uid),
    orderBy("updatedAt", "desc"),
  );
  const snapshot = await getDocs(draftsQuery);

  return snapshot.docs.map((draft) => toDraft(draft.id, draft.data()));
}

export async function deleteDraft(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "drafts", id));
}
