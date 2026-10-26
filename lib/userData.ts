import { getFirestore, collection, getDocs, limit, query, writeBatch } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

const SUBCOLLECTIONS = ["drafts", "analyses", "activity"];

// deletes every document in those subcollections, in batches
export async function deleteAllUserData(uid: string): Promise<void> {
  for (const name of SUBCOLLECTIONS) {
    const col = collection(db, "users", uid, name);
    for (;;) {
      const snap = await getDocs(query(col, limit(400)));
      if (snap.empty) break;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}