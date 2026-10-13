import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ResumeData = Record<string, unknown>;

export type ResumeDraft = {
  id: string;
  title: string;
  templateId: "blank" | "modern" | "professional" | "simple";
  targetRole: string;
  data: ResumeData;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export async function createDraft(
  uid: string,
  draft: {
    title: string;
    templateId: ResumeDraft["templateId"];
    targetRole: string;
    data: ResumeData;
  }
): Promise<string> {
  const draftsRef = collection(db, "users", uid, "drafts");

  const docRef = await addDoc(draftsRef, {
    ...draft,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function listDrafts(
  uid: string
): Promise<ResumeDraft[]> {
  const draftsRef = collection(db, "users", uid, "drafts");
  const draftsQuery = query(
    draftsRef,
    orderBy("updatedAt", "desc")
  );

  const snapshot = await getDocs(draftsQuery);

  return snapshot.docs.map((draftDoc) => ({
    id: draftDoc.id,
    ...draftDoc.data(),
  })) as ResumeDraft[];
}

export async function deleteDraft(
  uid: string,
  draftId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "drafts", draftId));
}