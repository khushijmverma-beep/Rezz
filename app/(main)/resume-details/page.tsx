"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { app } from "@/lib/firebase";
import {
  type ResumeData,
  emptyDetails,
  getResumeDetails,
  saveResumeDetails,
  mergeDetails,
  cleanDetails,
} from "@/lib/resumeDetails";
import ResumeDetailsView from "@/components/ResumeDetailsView";
import ResumeDetailsForm from "@/components/ResumeDetailsForm";
import ResumeDetailsChat from "@/components/ResumeDetailsChat";

const NO_INFO = "Please try again with more specific info.";

export default function ResumeDetailsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<ResumeData>(emptyDetails); // saved version
  const [form, setForm] = useState<ResumeData>(emptyDetails); // what's being edited
  const [editing, setEditing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  useEffect(() => {
    return onAuthStateChanged(getAuth(app), async (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        return;
      }
      try {
        const saved = await getResumeDetails(u.uid);
        // prefill email from the login email if it's empty
        const base = saved ?? emptyDetails;
        const withEmail = { ...base, email: base.email || u.email || "" };
        setDetails(withEmail);
        setHasSaved(!!saved);
        if (!saved) {
          // nothing saved yet: open straight into edit mode
          setForm(withEmail);
          setEditing(true);
        }
      } catch (e) {
        console.error(e);
        setError("Couldn't load your details. Check your Firestore rules.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const startEdit = () => {
    setForm(details);
    setError("");
    setBanner("");
    setEditing(true);
  };

  // used by both the chat and the upload: merge into the form, nothing is saved yet
  const handleFill = (fields: unknown) => {
    //  console.log("handleFill called with:", fields);
    const handleFill = (fields: unknown) => {
      const base = editing ? form : details;
      const merged = mergeDetails(base, fields);
      console.log("fields in:", fields);
      console.log("merged out:", merged);
      const changed = JSON.stringify(merged) !== JSON.stringify(base);
      setForm(merged);
      setEditing(true);
      setBanner(
        changed
          ? "Review the filled fields, then Save."
          : "Nothing new was found in that file.",
      );
    };
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      //  console.log("parse-resume status:", res.status, "response:", data);
      if (!res.ok) {
        setError(data.error ?? NO_INFO);
        return;
      }
      const fields = data.fields ?? data;
      if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
        setError(NO_INFO);
        return;
      }
      handleFill(fields);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const cleaned = cleanDetails(form);
      await Promise.race([
        saveResumeDetails(user.uid, cleaned),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000)),
    ]);
      setDetails(cleaned);
      setHasSaved(true);
      setEditing(false);
      setBanner("");
    } catch (e) {
      console.error(e);
      setError("Couldn't save. Check your Firestore rules.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setBanner("");
    setError("");
  };

  if (loading) return <p className="p-4 text-sm text-gray-500">Loading…</p>;

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <p className="text-sm text-gray-700">
          You need to be logged in to see this page.
        </p>
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 pb-4 pt-16 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        {editing ? (
          <>
            {!hasSaved && (
              <p className="mb-3 text-sm text-gray-600">
                Paste info on the right or upload a previous resume.
              </p>
            )}
            <ResumeDetailsForm
              value={form}
              onChange={setForm}
              onSave={handleSave}
              onCancel={handleCancel}
              onUpload={handleUpload}
              saving={saving}
              uploading={uploading}
              error={error}
              banner={banner}
            />
          </>
        ) : (
          <>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <ResumeDetailsView data={details} onEdit={startEdit} />
          </>
        )}
      </div>

      <aside className="lg:sticky lg:top-4 lg:self-start">
        <ResumeDetailsChat onFill={handleFill} />
      </aside>
    </div>
  );
}
