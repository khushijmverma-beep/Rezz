import { getFirestore, doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { app } from "@/lib/firebase";

const SIZE = 256;
const MAX_BYTES = 150 * 1024; 
const db = getFirestore(app);

const dataUrlBytes = (url: string) => Math.floor(((url.length - url.indexOf(",") - 1) * 3) / 4);

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image. Try a JPG or PNG."));
    };
    img.src = url;
  });
}

export async function resizeImageToDataUrl(file: File): Promise<string> {
  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process images.");

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, SIZE, SIZE);

  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);

  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrlBytes(dataUrl) > MAX_BYTES && quality > 0.3) {
    quality = Math.max(0.3, quality - 0.1);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

export async function getPhoto(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "users", uid));
  const url = snap.exists() ? snap.data().photoDataUrl : null;
  return typeof url === "string" && url ? url : null;
}

export async function savePhoto(uid: string, dataUrl: string): Promise<void> {
  await setDoc(doc(db, "users", uid), { photoDataUrl: dataUrl }, { merge: true });
}

export async function removePhoto(uid: string): Promise<void> {
  await setDoc(doc(db, "users", uid), { photoDataUrl: deleteField() }, { merge: true });
}