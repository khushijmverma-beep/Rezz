"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AnalyzePanel from "@/components/AnalyzePanel";
import { getDraft, updateDraft, type Draft } from "@/lib/drafts";
import { resumeToText } from "@/lib/resumeToText";
import type { ResumeData } from "@/lib/types/resume";
import { useAuth } from "@/lib/useAuth";
import styles from "./page.module.css";

type SaveStatus = "saving" | "saved" | "retrying";
type DraftContent = { title: string; data: ResumeData };

function ResumePaper({
  data,
  title,
  templateId,
}: {
  data: ResumeData;
  title: string;
  templateId: string;
}) {
  const groups = resumeToText(data)
    .split(/\n\n/)
    .filter(Boolean);
  const [header = "", ...sections] = groups;
  const [name = "", ...contact] = header.split("\n");

  return (
    <article className={styles.paper} aria-labelledby="resume-title">
      <header className={styles.resumeHeader}>
        <p className={styles.pageLabel}>{templateId} resume</p>
        <h1 id="resume-title">{name || title}</h1>
        {contact.length > 0 && (
          <div className={styles.contactDetails}>
            {contact.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}
      </header>
      <div className={styles.resumeSections}>
        {sections.map((section) => {
          const [heading = "", ...items] = section.split("\n");
          return (
            <section className={styles.resumeSection} key={heading}>
              <h2>{heading}</h2>
              <ul className={styles.entry}>
                {items.map((item) => (
                  <li key={item.replace(/^- /, "")}>{item.replace(/^- /, "")}</li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </article>
  );
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
  const { user, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [title, setTitle] = useState("");
  const [data, setData] = useState<ResumeData>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const titleRef = useRef("");
  const dataRef = useRef<ResumeData>({});
  const savedContentRef = useRef<string | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const loadDraft = useCallback(async () => {
    if (!user || !id) return;

    try {
      const loadedDraft = await getDraft(user.uid, id);
      setDraft(loadedDraft);
      const loadedTitle = loadedDraft?.title ?? "";
      const loadedData = loadedDraft?.data ?? {};
      titleRef.current = loadedTitle;
      dataRef.current = loadedData;
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
    if (authLoading || !user) return;

    const timeout = window.setTimeout(() => void loadDraft(), 0);
    return () => window.clearTimeout(timeout);
  }, [authLoading, loadDraft, user]);

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
            void loadDraft();
          }}
        >
          Retry
        </button>
        <Link href="/">Back to home</Link>
      </main>
    );
  }

  if (!user || !draft) {
    return (
      <main className={styles.messageView}>
        <h1>Resume not found</h1>
        <Link href="/">Back to home</Link>
      </main>
    );
  }

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
          <ResumePaper data={data} title={title} templateId={draft.templateId} />
        </div>
      </section>
      <aside className={styles.sidebar} aria-label="Resume analysis">
        <AnalyzePanel resumeText={resumeToText(data)} />
      </aside>
    </main>
  );
}
