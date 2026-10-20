
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResumeCard from "@/components/ResumeCard";
import {
  createDraft,
  deleteDraft,
  listDrafts,
  updateDraft,
  type Draft,
} from "@/lib/drafts";
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
        if (active) {
          setResult({ uid: user.uid, drafts: loadedDrafts });
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load resume drafts:", error);

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
    return (
      <p>
        <Link href="/login" className="underline">
          Sign in
        </Link>{" "}
        to view your saved resumes.
      </p>
    );
  }

  const uid = user.uid;

  if (!result || result.uid !== uid) {
    return <p aria-live="polite">Loading resumes...</p>;
  }

  if (result.error) {
    return <p role="alert">{result.error}</p>;
  }

  const drafts = result.drafts ?? [];

  async function refreshDrafts() {
    try {
      const loadedDrafts = await listDrafts(uid);
      setResult({ uid, drafts: loadedDrafts });
    } catch (error: unknown) {
      console.error("Could not refresh resumes:", error);
      window.alert("Could not refresh your resumes. Please try again.");
    }
  }

  async function handleDelete(resumeId: string) {
    const confirmed = window.confirm(
      "Delete this resume? This can't be undone."
    );

    if (!confirmed) return;

    try {
      await deleteDraft(uid, resumeId);

      setResult((current) =>
        current?.drafts
          ? {
              ...current,
              drafts: current.drafts.filter(
                (draft) => draft.id !== resumeId
              ),
            }
          : current
      );
    } catch (error: unknown) {
      console.error("Could not delete resume:", error);
      window.alert("Could not delete this resume. Please try again.");
    }
  }

  async function handleRename(draft: Draft) {
    const enteredTitle = window.prompt(
      "Enter a new resume name:",
      draft.title
    );

    if (enteredTitle === null) return;

    const title = enteredTitle.trim();

    if (!title) {
      window.alert("The resume name cannot be empty.");
      return;
    }

    try {
      await updateDraft(uid, draft.id, { title });
      await refreshDrafts();
    } catch (error: unknown) {
      console.error("Could not rename resume:", error);
      window.alert("Could not rename this resume. Please try again.");
    }
  }

  async function handleDuplicate(draft: Draft) {
    try {
      await createDraft(uid, {
        title: `Copy of ${draft.title}`,
        templateId: draft.templateId,
        targetRole: draft.targetRole,
        data: draft.data,
      });

      await refreshDrafts();
    } catch (error: unknown) {
      console.error("Could not duplicate resume:", error);
      window.alert("Could not duplicate this resume. Please try again.");
    }
  }

  function handleDownloadText(draft: Draft) {
    const data = draft.data;
    const fullName = [data.firstName, data.lastName]
      .filter(Boolean)
      .join(" ");

    const lines = [
      draft.title,
      "",
      fullName,
      data.email ?? "",
      data.phone ?? "",
      data.location ?? "",
      "",
      "SUMMARY",
      data.summary ?? "",
      "",
      "EXPERIENCE",
      ...data.experience.flatMap((item) => [
        item.title ?? "",
        item.company ?? "",
        item.startDate ?? "",
        item.endDate ?? "",
        item.location ?? "",
        item.bullets?.join("\n") ?? "",
        "",
      ]),
      "EDUCATION",
      ...data.education.flatMap((item) => [
        item.school ?? "",
        item.degree ?? "",
        "",
      ]),
      "SKILLS",
      ...(data.skills ?? []),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${draft.title || "resume"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (drafts.length === 0) {
    return (
      <p>
        You haven&apos;t created a resume yet.{" "}
        <Link href="/templates" className="underline">
          Choose a template
        </Link>{" "}
        to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {drafts.map((draft) => (
        <ResumeCard
          key={draft.id}
          draft={draft}
          viewMode="grid"
          dateLabel={`Edited ${new Date(
            draft.updatedAt
          ).toLocaleDateString()}`}
          onRename={handleRename}
          onDuplicate={handleDuplicate}
          onDownloadText={handleDownloadText}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
