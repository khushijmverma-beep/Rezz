"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResumeCard from "@/components/ResumeCard";
import { listDrafts, type Draft } from "@/lib/drafts";
import { useAuth } from "@/lib/useAuth";

export default function ResumeDraftList() {
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<{
    uid: string;
    drafts?: Draft[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    let active = true;

    void listDrafts(user.uid)
      .then((loadedDrafts) => {
        if (active) setResult({ uid: user.uid, drafts: loadedDrafts });
      })
      .catch((loadError: unknown) => {
        console.error("Failed to load resume drafts:", loadError);
        if (active) {
          setResult({
            uid: user.uid,
            error: "Couldn't load your resumes. Please try again.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  if (authLoading) {
    return <p aria-live="polite">Loading resumes...</p>;
  }

  if (!user) {
    return <p><Link href="/login" className="underline">Sign in</Link> to view your saved resumes.</p>;
  }

  if (!result || result.uid !== user.uid) {
    return <p aria-live="polite">Loading resumes...</p>;
  }

  if (result.error) {
    return <p role="alert">{result.error}</p>;
  }

  const drafts = result.drafts ?? [];

  if (drafts.length === 0) {
    return (
      <p>
        You haven&apos;t created a resume yet.{" "}
        <Link href="/templates" className="underline">Choose a template</Link> to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {drafts.map((draft) => (
        <ResumeCard
          key={draft.id}
          name={draft.title}
          updatedAt={new Date(draft.updatedAt).toLocaleDateString()}
          resumeId={draft.id}
        />
      ))}
    </div>
  );
}
