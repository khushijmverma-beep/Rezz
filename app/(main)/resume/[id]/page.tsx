"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AnalyzePanel from "@/components/AnalyzePanel";
import { createDraft, getDraft, updateDraft, type Draft } from "@/lib/drafts";
import { resumeToText } from "@/lib/resumeToText";
import { getTemplate } from "@/lib/templates";
import { emptyResumeData, type ResumeData } from "@/lib/types/resume";
import { useAuth } from "@/lib/useAuth";
import styles from "./page.module.css";

type SaveStatus = "saving" | "saved" | "retrying";
type DraftContent = { title: string; data: ResumeData };

const resumeKeys = Object.keys(emptyResumeData) as (keyof ResumeData)[];

// Each field sends a full resume copied from the data it last rendered. When two
// fields blur before the next render, keep only the keys that actually changed.
function assignResumeKey<K extends keyof ResumeData>(
  target: ResumeData,
  key: K,
  value: ResumeData[K],
) {
  target[key] = value;
}

function mergeResumeChange(latest: ResumeData, rendered: ResumeData, next: ResumeData): ResumeData {
  const merged = { ...latest };
  for (const key of resumeKeys) {
    if (!Object.is(next[key], rendered[key])) {
      assignResumeKey(merged, key, next[key]);
    }
  }
  return merged;
}

function LoadingSkeleton() {
  return (
    <div className={styles.loadingView} aria-label="Loading resume">
      <div className={styles.skeletonToolbar} />
      <div className={styles.skeletonPaper} />
      <div className={styles.skeletonPanel} />
    </div>
  );
}

export default function ResumeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [title, setTitle] = useState("");
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const titleRef = useRef("");
  const dataRef = useRef<ResumeData>(emptyResumeData);
  const renderedDataRef = useRef<ResumeData>(emptyResumeData);
  const creatingDraftRef = useRef(false);
  const savedContentRef = useRef<string | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const [createRetry, setCreateRetry] = useState(0);

  useEffect(() => {
    renderedDataRef.current = data;
    dataRef.current = data;
  }, [data]);

  const handleDataChange = (next: ResumeData) => {
    setData((prev) => {
      const merged = mergeResumeChange(prev, renderedDataRef.current, next);
      dataRef.current = merged;
      return merged;
    });
  };

  const loadDraft = useCallback(async () => {
    if (!user || !id || id === "new") return;

    try {
      const loadedDraft = await getDraft(user.uid, id);
      setDraft(loadedDraft);
      const loadedTitle = loadedDraft?.title ?? "";
      const loadedData = loadedDraft?.data ?? emptyResumeData;
      titleRef.current = loadedTitle;
      dataRef.current = loadedData;
      renderedDataRef.current = loadedData;
      savedContentRef.current = JSON.stringify({
        title: loadedTitle,
        data: loadedData,
      });
      setTitle(loadedTitle);
      setData(loadedData);
      setLoadError(null);
    } catch (error) {
      console.error("Failed to load resume draft:", error);
      setLoadError("Couldn't load this resume. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (authLoading || !user || id === "new") return;

    const timeout = window.setTimeout(() => void loadDraft(), 0);
    return () => window.clearTimeout(timeout);
  }, [authLoading, id, loadDraft, user]);

  useEffect(() => {
    if (id !== "new" || authLoading || !user || creatingDraftRef.current) return;

    creatingDraftRef.current = true;
    const requestedTemplate = new URLSearchParams(window.location.search).get("template");
    const template = getTemplate(requestedTemplate ?? "modern") ?? getTemplate("modern");
    const templateId = template?.id ?? "modern";
    const templateName = template?.name ?? "Modern";

    void createDraft(user.uid, {
      title: `${templateName} Resume`,
      templateId,
      data: emptyResumeData,
    })
      .then((draftId) => router.replace(`/resume/${draftId}`))
      .catch((error: unknown) => {
        console.error("Failed to create resume draft:", error);
        setLoadError("Couldn't create this resume. Please try again.");
        setLoading(false);
        creatingDraftRef.current = false;
      });
  }, [authLoading, createRetry, id, router, user]);

  const saveChanges = useCallback(async () => {
    if (!user || savedContentRef.current === null) return;

    while (true) {
      const inFlight = savePromiseRef.current;
      if (inFlight) {
        await inFlight;
        continue;
      }

      const snapshot: DraftContent = {
        title: titleRef.current,
        data: dataRef.current,
      };
      const serializedSnapshot = JSON.stringify(snapshot);
      if (serializedSnapshot === savedContentRef.current) return;

      let retryDelay = 1000;
      const operation = async () => {
        while (true) {
          setSaveStatus("saving");
          try {
            await updateDraft(user.uid, id, snapshot);
            savedContentRef.current = serializedSnapshot;
            if (
              serializedSnapshot ===
              JSON.stringify({ title: titleRef.current, data: dataRef.current })
            ) {
              setSaveStatus("saved");
            }
            return;
          } catch (error) {
            console.error("Failed to save resume draft:", error);
            setSaveStatus("retrying");
            await new Promise((resolve) =>
              window.setTimeout(resolve, retryDelay),
            );
            retryDelay = Math.min(retryDelay * 2, 30000);
          }
        }
      };

      const promise = operation();
      savePromiseRef.current = promise;
      try {
        await promise;
      } finally {
        savePromiseRef.current = null;
      }
      if (
        serializedSnapshot !==
        JSON.stringify({ title: titleRef.current, data: dataRef.current })
      ) {
        continue;
      }
      return;
    }
  }, [id, user]);

  useEffect(() => {
    if (!draft || !user || savedContentRef.current === null) return;

    const currentContent = JSON.stringify({ title, data });
    if (currentContent === savedContentRef.current) return;

    const timeout = window.setTimeout(() => {
      void saveChanges();
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [data, draft, saveChanges, title, user]);

  useEffect(() => {
    const saveBeforeLeaving = () => {
      void saveChanges();
    };
    window.addEventListener("beforeunload", saveBeforeLeaving);
    window.addEventListener("pagehide", saveBeforeLeaving);
    return () => {
      window.removeEventListener("beforeunload", saveBeforeLeaving);
      window.removeEventListener("pagehide", saveBeforeLeaving);
      void saveChanges();
    };
  }, [saveChanges]);

  if (authLoading || (user && loading)) {
    return <LoadingSkeleton />;
  }

  if (loadError) {
    return (
      <main className={styles.messageView}>
        <p role="alert">{loadError}</p>
        <button
          className={styles.retryButton}
          onClick={() => {
            setLoading(true);
            setLoadError(null);
            if (id === "new") {
              creatingDraftRef.current = false;
              setCreateRetry((retry) => retry + 1);
            } else {
              void loadDraft();
            }
          }}
        >
          Retry
        </button>
        <Link href="/">Back to home</Link>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.messageView}>
        <h1>Sign in to create and view resumes</h1>
        <Link href="/login">Sign in</Link>
      </main>
    );
  }

  if (!draft) {
    if (id === "new") return <LoadingSkeleton />;

    return (
      <main className={styles.messageView}>
        <h1>Resume not found</h1>
        <Link href="/">Back to home</Link>
      </main>
    );
  }

  const TemplateComponent = getTemplate(draft.templateId)?.Component;

  return (
    <main className={styles.resumeView}>
      <section className={styles.workspace} aria-label="Resume editor">
        <header className={styles.toolbar}>
          <Link className={styles.homeLink} href="/">
            ← Home
          </Link>
          <label className={styles.titleLabel} htmlFor="resume-title-input">
            Resume title
          </label>
          <input
            className={styles.titleInput}
            id="resume-title-input"
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              titleRef.current = nextTitle;
              setTitle(nextTitle);
              setSaveStatus("saving");
            }}
          />
          <span className={styles.saveStatus} aria-live="polite">
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved"
                : "Couldn't save, retrying"}
          </span>
        </header>
        <div className={styles.paperScroller}>
          {TemplateComponent ? (
            <TemplateComponent data={data} editable onChange={handleDataChange} />
          ) : (
            <p role="alert">This resume uses an unsupported template.</p>
          )}
        </div>
      </section>
      <aside className={styles.sidebar} aria-label="Resume analysis">
        <AnalyzePanel resumeText={resumeToText(data)} />
      </aside>
    </main>
  );
}
