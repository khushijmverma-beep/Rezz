"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { getPhoto, savePhoto, removePhoto, resizeImageToDataUrl } from "@/lib/profilePhoto";
import { getSettings, saveSettings } from "@/lib/userSettings";
import { deleteAllUserData } from "@/lib/userData";
// adjust these three imports to where your project keeps them
import { TEMPLATES } from "@/lib/templates"; // expects an array of { id: string; name: string }
import { listDrafts } from "@/lib/drafts"; // (uid: string) => Promise<unknown[]>
import { getAnalyses } from "@/lib/activity"; // (uid: string) => Promise<unknown[]>
import Avatar from "@/components/Avatar";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

const card = "rounded-lg border border-gray-300 bg-white px-5 py-4";
const h2 = "mt-0! mb-3! text-lg font-semibold";
const field =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none";
const primaryBtn =
  "cursor-pointer rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryBtn =
  "cursor-pointer rounded border border-gray-300 bg-white px-4 py-2 text-sm text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50";
const note = "mb-0! mt-3 rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-black!";

const providerLabel = (id: string) =>
  id === "password" ? "Email" : id === "google.com" ? "Google" : id;

export default function SettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // profile picture
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");

  // account
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent">("idle");
  const [accountError, setAccountError] = useState("");

  // preferences
  const [displayName, setDisplayName] = useState("");
  const [nameState, setNameState] = useState<"idle" | "saving" | "saved">("idle");
  const [nameError, setNameError] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templateState, setTemplateState] = useState<"idle" | "saving" | "saved">("idle");
  const [templateError, setTemplateError] = useState("");

  // your data
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(getAuth(app), async (u) => {
      setUser(u);
      if (u) {
        try {
          const [p, s] = await Promise.all([getPhoto(u.uid), getSettings(u.uid)]);
          setPhoto(p);
          setDisplayName(s.displayName ?? u.displayName ?? "");
          setTemplateId(s.defaultTemplateId ?? "");
        } catch (e) {
          console.error(e);
          setDisplayName(u.displayName ?? "");
        }
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-4 pt-16 text-sm text-gray-500">Loading…</p>;
  if (!user) return <p className="p-4 pt-16 text-sm text-gray-700">You need to be logged in.</p>;

  const name = displayName || user.displayName || user.email?.split("@")[0] || "";
  const providers = user.providerData.map((p) => providerLabel(p.providerId));
  const signInMethod = providers.length ? providers.join(", ") : "Email";
  const isEmailUser = user.providerData.some((p) => p.providerId === "password");

  /* ---------- profile picture ---------- */
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

  /* ---------- account ---------- */
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

  /* ---------- preferences ---------- */
  const handleSaveName = async () => {
    const trimmed = displayName.trim();
    setNameError("");
    if (!trimmed) {
      setNameError("Please enter a display name.");
      return;
    }
    if (trimmed.length > 60) {
      setNameError("Display names can be up to 60 characters.");
      return;
    }
    setNameState("saving");
    try {
      await saveSettings(user.uid, { displayName: trimmed });
      await updateProfile(user, { displayName: trimmed }); // so the sidebar shows it too
      setDisplayName(trimmed);
      setNameState("saved");
      setTimeout(() => setNameState("idle"), 2500);
    } catch (err) {
      console.error(err);
      setNameState("idle");
      setNameError("Couldn't save your display name. Please try again.");
    }
  };

  const handleTemplate = async (id: string) => {
    const previous = templateId;
    setTemplateId(id);
    setTemplateError("");
    setTemplateState("saving");
    try {
      await saveSettings(user.uid, { defaultTemplateId: id });
      setTemplateState("saved");
      setTimeout(() => setTemplateState("idle"), 2500);
    } catch (err) {
      console.error(err);
      setTemplateId(previous);
      setTemplateState("idle");
      setTemplateError("Couldn't save your default template. Please try again.");
    }
  };

  /* ---------- your data ---------- */
  const handleExport = async () => {
    setExportError("");
    setExporting(true);
    try {
      const [drafts, analyses] = await Promise.all([listDrafts(user.uid), getAnalyses(user.uid)]);
      const payload = {
        exportedAt: new Date().toISOString(),
        email: user.email,
        resumes: drafts,
        analyses,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rezz-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setExportError("Couldn't export your data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteAllUserData(user.uid);
      setDeleted(true);
      setConfirming(false);
      setConfirmText("");
    } catch (err) {
      console.error(err);
      setDeleteError("Couldn't delete your data. Some of it may still be there, so please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-4 pt-16">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Profile picture */}
      <section className={card}>
        <h2 className={h2}>Profile picture</h2>
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
            <p className="mb-0! text-xs text-gray-500">PNG, JPG or WebP, up to 5 MB.</p>
          </div>
        </div>
        {photoError && <p role="alert" className={note}>{photoError}</p>}
      </section>

      {/* Preferences */}
      <section className={card}>
        <h2 className={h2}>Preferences</h2>

        <label htmlFor="display-name" className="mb-1 block text-xs uppercase tracking-wide text-gray-500">
          Display name
        </label>
        <div className="flex gap-2">
          <input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            maxLength={60}
            className={field}
          />
          <button onClick={handleSaveName} disabled={nameState === "saving"} className={primaryBtn}>
            {nameState === "saving" ? "Saving…" : nameState === "saved" ? "Saved" : "Save"}
          </button>
        </div>
        {nameError && <p role="alert" className={note}>{nameError}</p>}

        <label htmlFor="default-template" className="mb-1 mt-5 block text-xs uppercase tracking-wide text-gray-500">
          Default template for new resumes
        </label>
        <div className="flex items-center gap-3">
          <select
            id="default-template"
            value={templateId}
            onChange={(e) => handleTemplate(e.target.value)}
            disabled={templateState === "saving"}
            className={field}
          >
            <option value="">No default</option>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <span className="w-16 shrink-0 text-sm text-gray-500" aria-live="polite">
            {templateState === "saving" ? "Saving…" : templateState === "saved" ? "Saved" : ""}
          </span>
        </div>
        {templateError && <p role="alert" className={note}>{templateError}</p>}
      </section>

      {/* Account */}
      <section className={card}>
        <h2 className={h2}>Account</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Email</dt>
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
          <button onClick={handleLogout} className={primaryBtn}>Log out</button>
        </div>

        {resetState === "sent" && <p className="mb-0! mt-3 text-sm text-gray-700!">Email sent</p>}
        {accountError && <p role="alert" className={note}>{accountError}</p>}
      </section>

      {/* Your data */}
      <section className={card}>
        <h2 className={h2}>Your data</h2>
        <p className="mb-3! text-sm text-gray-600!">
          Download a copy of your resumes and analyses, or permanently delete your resumes, analyses and
          activity history.
        </p>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} disabled={exporting} className={secondaryBtn}>
            {exporting ? "Preparing…" : "Export my data"}
          </button>
          {!confirming && (
            <button
              onClick={() => { setConfirming(true); setDeleted(false); setDeleteError(""); }}
              className={primaryBtn}
            >
              Delete my data
            </button>
          )}
        </div>
        {exportError && <p role="alert" className={note}>{exportError}</p>}

        {confirming && (
          <div className="mt-4 rounded border border-black p-4">
            <p className="mb-2! text-sm font-semibold text-black!">This can&apos;t be undone.</p>
            <p className="mb-3! text-sm text-gray-700!">
              Type <span className="font-mono font-semibold">DELETE</span> to permanently delete your
              resumes, analyses and activity days. Export your data first if you want a copy.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm"
              autoComplete="off"
              className={field}
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleDelete}
                disabled={confirmText !== "DELETE" || deleting}
                className={primaryBtn}
              >
                {deleting ? "Deleting…" : "Permanently delete"}
              </button>
              <button
                onClick={() => { setConfirming(false); setConfirmText(""); }}
                disabled={deleting}
                className={secondaryBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {deleted && <p role="status" className={note}>Your data has been deleted.</p>}
        {deleteError && <p role="alert" className={note}>{deleteError}</p>}
      </section>
    </div>
  );
}