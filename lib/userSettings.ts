import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

export type UserSettings = { displayName?: string; defaultTemplateId?: string };

export async function getSettings(uid: string): Promise<UserSettings> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return {};
  const d = snap.data();
  return {
    displayName: typeof d.displayName === "string" ? d.displayName : undefined,
    defaultTemplateId: typeof d.defaultTemplateId === "string" ? d.defaultTemplateId : undefined,
  };
}

// merge: true so the rest of users/{uid} is left alone
export async function saveSettings(uid: string, patch: UserSettings): Promise<void> {
  await setDoc(doc(db, "users", uid), patch, { merge: true });
}