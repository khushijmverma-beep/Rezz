"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  createDraft,
  deleteDraft,
  listDrafts,
  type Draft,
} from "@/lib/drafts";
import { getResumeDetails } from "@/lib/resumeDetails";
import { emptyResumeData, type ResumeData } from "@/lib/types/resume";
import TemplateCard from "@/components/TemplateCard";
import ResumeCard from "@/components/ResumeCard";
import NewResumeModal from "@/components/NewResumeModal";

type TemplateId = "blank" | "modern" | "professional" | "simple";

export default function Home() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>("blank");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadDrafts = useCallback(async (uid: string) => {
    setLoadingDrafts(true);
    setPageError("");

    try {
      setDrafts(await listDrafts(uid));
    } catch (error) {
      console.error("Could not load resumes:", error);
      setPageError("Could not load your resumes. Please try again.");
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        void loadDrafts(user.uid);
      } else {
        setUserId(null);
        setDrafts([]);
        setLoadingDrafts(false);
        router.replace("/login");
      }

      setCheckingAuth(false);
    });

    return unsubscribe;
  }, [router, loadDrafts]);

  const templates: { name: string; id: TemplateId }[] = [
    { name: "Blank resume", id: "blank" },
    { name: "Modern", id: "modern" },
    { name: "Professional", id: "professional" },
    { name: "Simple", id: "simple" },
  ];

  function openModal(templateId: TemplateId = "blank") {
    setSelectedTemplate(templateId);
    setIsModalOpen(true);
  }

  async function handleCreate(details: {
    title: string;
    templateId: TemplateId;
    startOption: "default" | "empty" | "upload";
    targetRole: string;
    file: File | null;
  }) {
    if (!userId) {
      throw new Error("Please log in before creating a resume.");
    }

    let data: ResumeData = emptyResumeData;

    if (details.startOption === "default") {
      const savedDetails = await getResumeDetails(userId);
      if (!savedDetails) {
        throw new Error("No saved resume details were found.");
      }
      data = { ...emptyResumeData, ...savedDetails };
    } else if (details.startOption === "upload") {
      if (!details.file) {
        throw new Error("Please select a PDF to upload.");
      }

      if (details.file.type !== "application/pdf") {
        throw new Error("The resume parser currently accepts PDF files only.");
      }

      const formData = new FormData();
      formData.append("file", details.file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not parse the uploaded resume."
        );
      }

      if (!result.fields || typeof result.fields !== "object") {
        throw new Error("Could not parse the uploaded resume.");
      }

      data = result.fields as ResumeData;
    }

    const resumeId = await createDraft(userId, {
      title: details.title,
      templateId: details.templateId,
      targetRole: details.targetRole,
      data,
    });

    setIsModalOpen(false);
    await loadDrafts(userId);
    router.push(`/resume/${resumeId}`);
  }

  async function handleDelete(resumeId: string) {
    if (!userId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this resume? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await deleteDraft(userId, resumeId);

      setDrafts((current) =>
        current.filter((draft) => draft.id !== resumeId)
      );

      setPageError("");
    } catch (error) {
      console.error("Could not delete resume:", error);
      setPageError("Could not delete this resume. Please try again.");
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center pt-16">
        <p className="text-sm text-gray-500">
          Loading your account...
        </p>
      </main>
    );
  }

  if (!userId) return null;

  return (
    <main className="pt-16">
      <section>
        <h1 className="text-2xl font-semibold">
          Start a new resume
        </h1>

        <div className="mt-6 flex gap-5 overflow-x-auto pb-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              name={template.name}
              templateId={template.id}
              onClick={() => openModal(template.id)}
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">
          Your resumes
        </h2>

        {pageError && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {pageError}
          </p>
        )}

        {loadingDrafts ? (
          <p className="mt-6 text-sm text-gray-500">
            Loading your resumes...
          </p>
        ) : drafts.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => (
              <ResumeCard
                key={draft.id}
                resumeId={draft.id}
                name={draft.title}
                templateId={draft.templateId}
                updatedAt={new Date(draft.updatedAt).toLocaleDateString()}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              No current resumes yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Upload a previous resume or create a new one.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => openModal("blank")}
                className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Create a new resume
              </button>

              <button
                type="button"
                onClick={() => openModal("blank")}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Upload a previous resume
              </button>
            </div>
          </div>
        )}
      </section>

      <NewResumeModal
        isOpen={isModalOpen}
        initialTemplate={selectedTemplate}
        hasDefaultDetails={false}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </main>
  );
}
