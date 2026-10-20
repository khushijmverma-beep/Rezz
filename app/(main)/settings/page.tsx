"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
  type User,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { getPhoto, savePhoto, removePhoto, resizeImageToDataUrl } from "@/lib/profilePhoto";
import Avatar from "@/components/Avatar";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const card = "rounded-lg border border-gray-300 bg-white px-5 pb-7";
const primaryBtn =
  "cursor-pointer rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryBtn =
  "cursor-pointer rounded border border-gray-300 bg-white px-4 py-2 text-sm text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50";

const providerLabel = (id: string) =>
  id === "password" ? "Email" : id === "google.com" ? "Google" : id;

export default function SettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null); // saved photo
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [resetState, setResetState] = useState<"idle" | "sending" | "sent">("idle");
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(getAuth(app), async (u) => {
      setUser(u);
      if (u) {
        try {
          setPhoto(await getPhoto(u.uid));
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-4 pt-16 text-sm text-gray-500">Loading…</p>;
  if (!user) return <p className="p-4 pt-16 text-sm text-gray-700">You need to be logged in.</p>;

  const name = user.displayName || user.email?.split("@")[0] || "";
  const providers = user.providerData.map((p) => providerLabel(p.providerId));
  const signInMethod = providers.length ? providers.join(", ") : "Email";
  const isEmailUser = user.providerData.some((p) => p.providerId === "password");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets you pick the same file again
    if (!file) return;

    setPhotoError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError("Please choose a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setPhotoError("That image is larger than 5 MB. Please choose a smaller one.");
      return;
    }

    setSaving(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      await savePhoto(user.uid, dataUrl);
      setPhoto(dataUrl);
    } catch (err) {
      console.error(err);
      setPhotoError(err instanceof Error ? err.message : "Couldn't save your photo. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setPhotoError("");
    setSaving(true);
    try {
      await removePhoto(user.uid);
      setPhoto(null);
    } catch (err) {
      console.error(err);
      setPhotoError("Couldn't remove your photo. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user.email) return;
    setAccountError("");
    setResetState("sending");
    try {
      await sendPasswordResetEmail(getAuth(app), user.email);
      setResetState("sent");
    } catch (err) {
      console.error(err);
      setResetState("idle");
      setAccountError("Couldn't send the email. Please try again in a minute.");
    }
  };

  const handleLogout = async () => {
    await signOut(getAuth(app));
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-4 pt-16">
      <h1 className="text-xl font-semibold">Settings</h1>
      <section className={card}>
        <h2 className="mt-4! mb-3! text-lg font-semibold">Profile picture</h2>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={name} size={96} src={photo ?? user.photoURL} />
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFile}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={saving} className={primaryBtn}>
                {saving ? "Saving…" : "Upload photo"}
              </button>
              <button onClick={handleRemove} disabled={saving || !photo} className={secondaryBtn}>
                Remove photo
              </button>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG or WebP, up to 5 MB.</p>
          </div>
        </div>
        {photoError && (
          <p role="alert" className="mt-3 rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-black">
            {photoError}
          </p>
        )}
      </section>

    
      <section className={card}>
        <h2 className="mt-4! mb-4 text-lg font-semibold">Account</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-black">Email</dt>
            <dd className="break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Sign-in method</dt>
            <dd>{signInMethod}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isEmailUser && (
            <button onClick={handleReset} disabled={resetState === "sending"} className={secondaryBtn}>
              {resetState === "sending" ? "Sending…" : "Send password reset email"}
            </button>
          )}
          <button onClick={handleLogout} className={primaryBtn}>
            Log out
          </button>
        </div>

        {resetState === "sent" && <p className="mt-3 text-sm text-gray-700">Email sent</p>}
        {accountError && (
          <p role="alert" className="mt-3 rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-black">
            {accountError}
          </p>
        )}
      </section>
    </div>
  );
}