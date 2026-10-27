"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  createDraft,
  deleteDraft,
  listDrafts,
  updateDraft,
  type Draft,
} from "@/lib/drafts";
import {
  emptyResumeData,
  type ResumeData,
  type TemplateId,
} from "@/lib/types/resume";
import { getResumeDetails } from "@/lib/resumeDetails";
import { templates } from "@/lib/templates";
import TemplateCard from "@/components/TemplateCard";
import ResumeCard from "@/components/ResumeCard";
import NewResumeModal from "@/components/NewResumeModal";
import HomeToolbar from "@/components/HomeToolbar";
import HomeTopBar from "@/components/HomeTopBar";
import { nextCopyName } from "@/lib/nextCopyName";

type SortBy = "updatedAt" | "createdAt" | "title";
type ViewMode = "grid" | "list";

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

  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [descending, setDescending] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");

  // Restore saved toolbar preferences.
  useEffect(() => {
    try {
      const savedSort = localStorage.getItem("rezz-home-sort");
      const savedOrder = localStorage.getItem("rezz-home-descending");
      const savedView = localStorage.getItem("rezz-home-view");

      if (
        savedSort === "updatedAt" ||
        savedSort === "createdAt" ||
        savedSort === "title"
      ) {
        setSortBy(savedSort);
      }

      if (savedOrder === "true" || savedOrder === "false") {
        setDescending(savedOrder === "true");
      }

      if (savedView === "grid" || savedView === "list") {
        setViewMode(savedView);
      }
    } catch {
      // Keep defaults if browser storage is unavailable.
    }
  }, []);

  // Persist toolbar preferences.
  useEffect(() => {
    try {
      localStorage.setItem("rezz-home-sort", sortBy);
      localStorage.setItem("rezz-home-descending", String(descending));
      localStorage.setItem("rezz-home-view", viewMode);
    } catch {
      // The page still works if preferences cannot be saved.
    }
  }, [sortBy, descending, viewMode]);

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
        throw new Error(
          "The resume parser currently accepts PDF files only.",
        );
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
          result.error || "Could not parse the uploaded resume.",
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
      "Delete this resume? This can't be undone.",
    );

    if (!confirmed) return;

    try {
      await deleteDraft(userId, resumeId);

      setDrafts((current) =>
        current.filter((draft) => draft.id !== resumeId),
      );

      setPageError("");
    } catch (error) {
      console.error("Could not delete resume:", error);
      setPageError("Could not delete this resume. Please try again.");
    }
  }

  async function handleRename(draft: Draft) {
    if (!userId) return;

    const title = window.prompt("Enter a new resume title:", draft.title);

    if (title === null) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      window.alert("Resume title cannot be empty.");
      return;
    }

    try {
      await updateDraft(userId, draft.id, { title: trimmedTitle });
      await loadDrafts(userId);
    } catch (error) {
      console.error("Could not rename resume:", error);
      setPageError("Could not rename this resume. Please try again.");
    }
  }

  async function handleDuplicate(draft: Draft) {
    if (!userId) return;

    try {
      const resumeId = await createDraft(userId, {
        title: nextCopyName(
          draft.title,
          drafts.map((existingDraft) => existingDraft.title),
        ),
        templateId: draft.templateId,
        targetRole: draft.targetRole,
        data: draft.data,
      });

      await loadDrafts(userId);
      router.push(`/resume/${resumeId}`);
    } catch (error) {
      console.error("Could not duplicate resume:", error);
      setPageError("Could not duplicate this resume. Please try again.");
    }
  }

  function handleDownloadText(draft: Draft) {
    const data = draft.data;

    const lines = [
      `${data.firstName} ${data.lastName}`.trim(),
      data.email,
      data.phone,
      data.location,
      data.linkedin,
      data.github,
      data.website,
      "",
      "SUMMARY",
      data.summary,
      "",
      "EXPERIENCE",
      ...data.experience.flatMap((item) => [
        `${item.title} — ${item.company}`,
        item.location,
        `${item.startDate} - ${item.endDate}`,
        ...item.bullets,
        "",
      ]),
      "EDUCATION",
      ...data.education.flatMap((item) => [
        item.school,
        `${item.degree} ${item.field}`.trim(),
        `${item.startDate} - ${item.endDate}`,
        item.gpa ? `GPA: ${item.gpa}` : "",
        "",
      ]),
      "SKILLS",
      data.skills.join(", "),
      "",
      "PROJECTS",
      ...data.projects.flatMap((item) => [
        item.name,
        item.link,
        item.description,
        "",
      ]),
      "AWARDS",
      ...data.awards,
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${draft.title.replace(/[<>:"/\\|?*]/g, "_")}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  // Search by resume title, then sort the matching results.
  const searchQuery = search.trim().toLowerCase();

  const sortedDrafts = [...drafts]
    .filter((draft) =>
      draft.title.toLowerCase().includes(searchQuery),
    )
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
      } else {
        comparison = (a[sortBy] ?? 0) - (b[sortBy] ?? 0);
      }

      return descending ? -comparison : comparison;
    });

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
    <main className="pt-0">
      <HomeTopBar
        search={search}
        onSearchChange={setSearch}
      />

      <section className="-mx-4 bg-gray-50 px-4 py-5 sm:-mx-6 sm:px-6">
        <h2 className="text-xl font-semibold">
          Start a new resume
        </h2>

        <div className="mt-4 flex gap-5 overflow-x-auto pb-3">
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

      <section className="mt-8">
        <h2 className="text-xl font-semibold">
          Your resumes
        </h2>

        <HomeToolbar
          sortBy={sortBy}
          onSortByChange={(value) => {
            setSortBy(value);
            setDescending(value !== "title");
          }}
          descending={descending}
          onToggleOrder={() => setDescending((value) => !value)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {pageError && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {pageError}
          </p>
        )}

        {loadingDrafts ? (
          <p className="mt-6 text-sm text-gray-500">
            Loading your resumes...
          </p>
        ) : sortedDrafts.length > 0 ? (
          <div
            className={`mt-6 ${
              viewMode === "grid"
                ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-3"
            }`}
          >
            {sortedDrafts.map((draft) => (
              <ResumeCard
                key={draft.id}
                draft={draft}
                viewMode={viewMode}
                dateKind={
                  sortBy === "createdAt" ? "Created" : "Modified"
                }
                dateLabel={new Date(
                  sortBy === "createdAt"
                    ? draft.createdAt
                    : draft.updatedAt,
                ).toLocaleDateString()}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
                onDownloadText={handleDownloadText}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="mt-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-900">
              No resumes match "{search.trim()}"
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-2 text-sm text-gray-600 underline hover:text-gray-900"
            >
              Clear search
            </button>
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