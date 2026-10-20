
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getResumeDetails } from "@/lib/resumeDetails";
import { TEMPLATES } from "@/lib/templates";
import type { TemplateId } from "@/lib/types/resume";

type StartOption = "default" | "empty" | "upload";

type NewResumeModalProps = {
  isOpen: boolean;
  initialTemplate: TemplateId;
  hasDefaultDetails: boolean;
  onClose: () => void;
  onCreate: (details: {
    title: string;
    templateId: TemplateId;
    startOption: StartOption;
    targetRole: string;
    file: File | null;
  }) => Promise<void>;
};

const templates: { id: TemplateId; name: string }[] = TEMPLATES.map(
  ({ id, label }) => ({ id, name: label }),
);

export default function NewResumeModal({
  isOpen,
  initialTemplate,
  hasDefaultDetails,
  onClose,
  onCreate,
}: NewResumeModalProps) {
  const [templateId, setTemplateId] =
    useState<TemplateId>(initialTemplate);
  const [startOption, setStartOption] = useState<StartOption>(
    hasDefaultDetails ? "default" : "empty"
  );
  const [title, setTitle] = useState("Untitled resume");
  const [targetRole, setTargetRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [hasSavedDefaultDetails, setHasSavedDefaultDetails] = useState(false);
  const [isCheckingDefaultDetails, setIsCheckingDefaultDetails] = useState(false);
  const [defaultDetailsError, setDefaultDetailsError] = useState("");
  const canUseDefaultDetails = hasDefaultDetails || hasSavedDefaultDetails;

  useEffect(() => {
    if (isOpen) {
      setTemplateId(initialTemplate);
      setStartOption(hasDefaultDetails ? "default" : "empty");
      setTitle("Untitled resume");
      setTargetRole("");
      setFile(null);
      setError("");
      setIsCreating(false);
    }
  }, [isOpen, initialTemplate, hasDefaultDetails]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setHasSavedDefaultDetails(false);
        setDefaultDetailsError("");
        setIsCheckingDefaultDetails(true);

        const user = auth.currentUser;
        if (!user) {
          throw new Error("No authenticated user is available.");
        }
        return getResumeDetails(user.uid);
      })
      .then((details) => {
        if (active && details) setHasSavedDefaultDetails(true);
      })
      .catch((loadError: unknown) => {
        console.error("Could not check saved resume details:", loadError);
        if (active) {
          setDefaultDetailsError(
            "Couldn't check your saved resume details. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) setIsCheckingDefaultDetails(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isCreating) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCreating, onClose]);

  if (!isOpen) return null;

  async function handleCreate() {
    if (!title.trim()) {
      setError("Please enter a resume name.");
      return;
    }

    if (startOption === "upload" && !file) {
      setError("Please select a PDF or TXT resume to upload.");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      await onCreate({
        title: title.trim(),
        templateId,
        startOption,
        targetRole: targetRole.trim(),
        file,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create the resume. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isCreating) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-resume-title"
        className="my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="new-resume-title"
              className="text-2xl font-semibold text-gray-900"
            >
              Create a new resume
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a template and how you want to get started.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            disabled={isCreating}
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <section className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Choose a template
          </h3>

          <div className="grid grid-cols-4 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                disabled={isCreating}
                onClick={() => setTemplateId(template.id)}
                className={`min-w-0 rounded-lg p-2 text-center ${
                  templateId === template.id
                    ? "bg-gray-100 ring-2 ring-black"
                    : "border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex aspect-[8.5/11] items-center justify-center rounded border border-gray-200 bg-gray-50">
                  {template.id === "blank" ? (
                    <span className="text-3xl text-gray-400">+</span>
                  ) : (
                    <span className="px-1 text-xs text-gray-500">
                      {template.name}
                    </span>
                  )}
                </div>
                <span className="mt-2 block text-xs font-medium text-gray-800">
                  {template.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Start with
          </h3>

          <div className="space-y-3">
            <label
              className={`flex gap-3 rounded-lg border p-3 ${
                startOption === "default"
                  ? "border-black bg-gray-50"
                  : "border-gray-200"
              } ${
                !canUseDefaultDetails || isCheckingDefaultDetails
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="startOption"
                value="default"
                checked={startOption === "default"}
                disabled={
                  !canUseDefaultDetails || isCheckingDefaultDetails || isCreating
                }
                onChange={() => setStartOption("default")}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  My default resume details
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Start with your saved personal and work information.
                </span>
                {isCheckingDefaultDetails && (
                  <span className="mt-1 block text-xs text-gray-500">
                    Checking saved details…
                  </span>
                )}
                {defaultDetailsError && (
                  <span role="alert" className="mt-1 block text-xs text-red-600">
                    {defaultDetailsError}
                  </span>
                )}
                {!canUseDefaultDetails &&
                  !isCheckingDefaultDetails &&
                  !defaultDetailsError && (
                  <a
                    href="/resume-details"
                    className="mt-1 inline-block text-xs font-medium underline"
                  >
                    Add resume details
                  </a>
                )}
              </span>
            </label>

            <label
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                startOption === "empty"
                  ? "border-black bg-gray-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="startOption"
                value="empty"
                checked={startOption === "empty"}
                disabled={isCreating}
                onChange={() => setStartOption("empty")}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  Start empty
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Create a resume from scratch.
                </span>
              </span>
            </label>

            <label
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                startOption === "upload"
                  ? "border-black bg-gray-50"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="startOption"
                value="upload"
                checked={startOption === "upload"}
                disabled={isCreating}
                onChange={() => setStartOption("upload")}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium text-gray-900">
                  Upload a previous resume
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Upload a PDF or TXT file to reuse its information.
                </span>
                {startOption === "upload" && (
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    disabled={isCreating}
                    onChange={(event) => {
                      const selectedFile = event.target.files?.[0] ?? null;

                      if (
                        selectedFile &&
                        (!/\.pdf$/i.test(selectedFile.name) ||
                        selectedFile.type !== "application/pdf")
                        ) {
                        setFile(null);
                        setError("Please choose a PDF file.");
                        return;
                        }

                      setFile(selectedFile);
                      setError("");
                    }}
                    className="mt-3 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium"
                  />
                )}
              </span>
            </label>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="resume-name"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Resume name
            </label>
            <input
              id="resume-name"
              type="text"
              required
              maxLength={100}
              value={title}
              disabled={isCreating}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="Untitled resume"
            />
          </div>

          <div>
            <label
              htmlFor="target-role"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Target role or company (optional)
            </label>
            <input
              id="target-role"
              type="text"
              value={targetRole}
              disabled={isCreating}
              onChange={(event) => setTargetRole(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
              placeholder="e.g. Software Engineering Intern at Google"
            />
          </div>
        </section>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            disabled={isCreating}
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isCreating}
            onClick={handleCreate}
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create resume"}
          </button>
        </div>
      </div>
    </div>
  );
}
