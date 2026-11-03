"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnalyzePanel from "@/components/AnalyzePanel";
import ChangeTemplateDialog from "@/components/ChangeTemplateDialog";
import DownloadMenu from "@/components/DownloadMenu";
import SectionNav from "@/components/SectionNav";
import StyleToolbar from "@/components/StyleToolbar";
import PrintRoot from "@/components/templates/PrintRoot";
import { logActivity, saveAnalysis, updateAnalysisFeedback } from "@/lib/activity";
import { createDraft, getDraft, listDrafts, updateDraft, type Draft } from "@/lib/drafts";
import { downloadPdf } from "@/lib/exportResume";
import { nextCopyName } from "@/lib/nextCopyName";
import { resumeToText } from "@/lib/resumeToText";
import { getTemplate } from "@/lib/templates";
import type { JobMatchResult } from "@/lib/types/job-match";
import { emptyResumeData, type ResumeData, type TemplateId } from "@/lib/types/resume";
import { useAuth } from "@/lib/useAuth";
import styles from "./page.module.css";

type SaveStatus = "saving" | "saved" | "retrying";
type DraftContent = { title: string; templateId: string; data: ResumeData };

const editorSections = [
  { id: "profile", label: "Profile" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "awards", label: "Awards" },
  { id: "certifications", label: "Certifications" },
  { id: "languages", label: "Languages" },
];

function trackActivity(uid: string, type: "edit" | "export" | "analysis") {
  void logActivity(uid, type).catch((error: unknown) => {
    console.error("Failed to record resume activity:", error);
  });
}

// "style" is optional, so emptyResumeData has no key for it; add it explicitly.
const resumeKeys = [...Object.keys(emptyResumeData), "style"] as (keyof ResumeData)[];

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
    <div className={`home-page ${styles.loadingView}`} aria-label="Loading resume">
      <div className={styles.skeletonToolbar} />
      <div className={styles.skeletonNav} />
      <div className={styles.skeletonWorkspace}>
        <div className={styles.skeletonPaper} />
      </div>
      <div className={styles.skeletonPanel} />
    </div>
  );
}

export default function ResumeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const downloadQuery = searchParams.toString();
  const shouldDownloadPdf = searchParams.get("download") === "pdf";
  const { user, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [title, setTitle] = useState("");
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const titleRef = useRef("");
  const templateIdRef = useRef("");
  const dataRef = useRef<ResumeData>(emptyResumeData);
  const renderedDataRef = useRef<ResumeData>(emptyResumeData);
  const creatingDraftRef = useRef(false);
  const savedContentRef = useRef<string | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const autoDownloadHandledRef = useRef(false);
  const [createRetry, setCreateRetry] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [lastAnalysisId, setLastAnalysisId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [sectionsOpen, setSectionsOpen] = useState(true);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const previewPaperRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewHeight, setPreviewHeight] = useState(1056);
  const [previewLeft, setPreviewLeft] = useState(0);

  useEffect(() => {
    renderedDataRef.current = data;
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const frame = previewFrameRef.current;
    const paper = previewPaperRef.current;
    if (!frame || !paper) return;

    const updatePreviewSize = () => {
      const availableWidth = frame.clientWidth;
      const scale = Math.min(1.12, availableWidth / paper.offsetWidth);
      setPreviewScale(scale);
      setPreviewHeight(paper.offsetHeight * scale);
      setPreviewLeft(Math.max(0, (availableWidth - paper.offsetWidth * scale) / 2));
    };

    const observer = new ResizeObserver(updatePreviewSize);
    observer.observe(frame);
    observer.observe(paper);
    updatePreviewSize();
    return () => observer.disconnect();
  }, [draft]);

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
      const loadedTemplateId = loadedDraft?.templateId ?? "";
      const loadedData = {
        ...emptyResumeData,
        ...loadedDraft?.data,
        certifications: loadedDraft?.data.certifications ?? [],
        languages: loadedDraft?.data.languages ?? [],
      };
      titleRef.current = loadedTitle;
      templateIdRef.current = loadedTemplateId;
      dataRef.current = loadedData;
      renderedDataRef.current = loadedData;
      savedContentRef.current = JSON.stringify({
        title: loadedTitle,
        templateId: loadedTemplateId,
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
    if (
      !shouldDownloadPdf ||
      !draft ||
      !user ||
      loading ||
      autoDownloadHandledRef.current
    ) {
      return;
    }

    const params = new URLSearchParams(downloadQuery);
    params.delete("download");
    const remainingQuery = params.toString();
    const resumeUrl = `/resume/${id}${remainingQuery ? `?${remainingQuery}` : ""}`;
    const startedAt = Date.now();
    let frame = 0;
    let timeout = 0;
    let active = true;

    const removeDownloadQuery = () => {
      router.replace(resumeUrl, { scroll: false });
    };

    const finish = () => {
      active = false;
      window.clearTimeout(timeout);
      removeDownloadQuery();
    };

    const waitForPrintRoot = () => {
      if (!active) return;

      if (document.querySelector("#print-root > article")) {
        autoDownloadHandledRef.current = true;
        try {
          downloadPdf(titleRef.current);
          trackActivity(user.uid, "export");
        } catch (error) {
          console.error("Could not download resume as PDF:", error);
          setDownloadError("Couldn't prepare the PDF. Please try again.");
        } finally {
          finish();
        }
        return;
      }

      if (Date.now() - startedAt > 5000) {
        autoDownloadHandledRef.current = true;
        setDownloadError("Couldn't prepare the PDF. Please try again.");
        finish();
        return;
      }

      frame = window.requestAnimationFrame(waitForPrintRoot);
    };

    frame = window.requestAnimationFrame(waitForPrintRoot);
    timeout = window.setTimeout(() => {
      if (!active) return;
      active = false;
      autoDownloadHandledRef.current = true;
      window.cancelAnimationFrame(frame);
      setDownloadError("Couldn't prepare the PDF. Please try again.");
      removeDownloadQuery();
    }, 6000);

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [downloadQuery, draft, id, loading, router, shouldDownloadPdf, user]);

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
        templateId: templateIdRef.current,
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
            trackActivity(user.uid, "edit");
            if (
              serializedSnapshot ===
              JSON.stringify({ title: titleRef.current, templateId: templateIdRef.current, data: dataRef.current })
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
        JSON.stringify({ title: titleRef.current, templateId: templateIdRef.current, data: dataRef.current })
      ) {
        continue;
      }
      return;
    }
  }, [id, user]);

  useEffect(() => {
    if (!draft || !user || savedContentRef.current === null) return;

    const currentContent = JSON.stringify({ title, templateId: draft.templateId, data });
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

  // Same copy logic as Home's "Make a copy": createDraft + nextCopyName.
  const handleMakeCopy = async () => {
    if (!user || !draft) return;
    setCopying(true);
    setCopyError(null);
    try {
      // Flush pending edits so the copy has the latest title, template and data.
      await saveChanges();
      const existingTitles = (await listDrafts(user.uid)).map((d) => d.title);
      const copyId = await createDraft(user.uid, {
        title: nextCopyName(titleRef.current, existingTitles),
        templateId: templateIdRef.current,
        // Firestore rejects undefined fields, so only include targetRole if set.
        ...(draft.targetRole !== undefined && { targetRole: draft.targetRole }),
        data: dataRef.current,
      });
      router.push(`/resume/${copyId}`);
    } catch (error) {
      console.error("Could not copy resume:", error);
      setCopyError("Couldn't make a copy. Please try again.");
      setCopying(false);
    }
  };

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
  const printTemplateId = getTemplate(draft.templateId)?.id ?? "blank";

  return (
    <main
      className={`home-page ${styles.resumeView} ${
        !sectionsOpen && !analysisOpen
          ? styles.bothPanelsClosed
          : !sectionsOpen
            ? styles.sectionsClosed
            : !analysisOpen
              ? styles.analysisClosed
              : ""
      }`}
    >
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
        <div className={styles.toolbarActions}>
          <div className={styles.templateAction}>
            <button
              type="button"
              onClick={() => setTemplateDialogOpen(true)}
              className={styles.actionButton}
            >
              Change template
            </button>
          </div>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.copyAction}`}
            onClick={() => void handleMakeCopy()}
            disabled={copying || saveStatus !== "saved"}
          >
            {copying ? "Copying..." : "Make a copy"}
          </button>
          <div className={styles.downloadAction}>
            <DownloadMenu
              title={title}
              data={data}
              downloadPdf={downloadPdf}
              onExport={() => trackActivity(user.uid, "export")}
            />
          </div>
        </div>
        <details className={styles.styleDisclosure}>
          <summary className={styles.styleSummary}>
            <span>Page style</span>
            <span>Fonts, text color, accent color, and size</span>
          </summary>
          <section className={styles.styleTools} aria-label="Page style controls">
            <StyleToolbar
              style={data.style}
              onChange={(style) => handleDataChange({ ...dataRef.current, style })}
            />
          </section>
        </details>
      </header>
      {(copyError || downloadError) && (
        <div className={styles.toolbarErrors}>
          {copyError && <p role="alert">{copyError}</p>}
          {downloadError && <p role="alert">{downloadError}</p>}
        </div>
      )}
      <div className={`${styles.sectionNav} ${!sectionsOpen ? styles.collapsedPanel : ""}`}>
        <button
          type="button"
          className={`${styles.panelToggle} ${styles.sectionToggle} ${!sectionsOpen ? styles.toggleCollapsed : ""}`}
          aria-label={sectionsOpen ? "Hide sections panel" : "Show sections panel"}
          aria-expanded={sectionsOpen}
          onClick={() => setSectionsOpen((open) => !open)}
        >
          <span aria-hidden="true">{sectionsOpen ? "‹" : "›"}</span>
        </button>
        {sectionsOpen && <SectionNav sections={editorSections} />}
      </div>
      <section className={styles.workspace} aria-label="Resume editor">
        <div className={styles.paperScroller}>
          {TemplateComponent ? (
            <div
              ref={previewFrameRef}
              className={styles.paperFrame}
              style={{ height: previewHeight }}
            >
              <div
                ref={previewPaperRef}
                className={styles.paperScale}
                style={{
                  left: previewLeft,
                  transform: `scale(${previewScale})`,
                }}
              >
                <TemplateComponent data={data} editable onChange={handleDataChange} />
              </div>
            </div>
          ) : (
            <p role="alert">This resume uses an unsupported template.</p>
          )}
        </div>
      </section>
      <aside className={`${styles.sidebar} ${!analysisOpen ? styles.collapsedPanel : ""}`} aria-label="Resume analysis">
        <button
          type="button"
          className={`${styles.panelToggle} ${styles.analysisToggle} ${!analysisOpen ? styles.toggleCollapsed : ""}`}
          aria-label={analysisOpen ? "Hide analysis panel" : "Show analysis panel"}
          aria-expanded={analysisOpen}
          onClick={() => setAnalysisOpen((open) => !open)}
        >
          <span aria-hidden="true">{analysisOpen ? "›" : "‹"}</span>
        </button>
        {analysisOpen && (
          <AnalyzePanel
            resumeText={resumeToText(data)}
            data={data}
            templateId={draft.templateId}
            onResult={(result: JobMatchResult, jobDescription: string) => {
              // saveAnalysis also records the "analysis" activity.
              setLastAnalysisId(null);
              void saveAnalysis(user.uid, {
                draftId: id,
                draftTitle: titleRef.current,
                matchScore: result.overallFit.matchScore,
                rating: result.overallFit.rating,
                atsScore: result.ats?.score,
                humanScore: result.human?.score,
                templateId: draft.templateId,
                scorerVersion: result.scorerVersion,
                jobDescription,
              })
                .then(setLastAnalysisId)
                .catch((error: unknown) => {
                  console.error("Failed to save resume analysis:", error);
                });
            }}
            onFeedback={async (rating, note) => {
              if (!lastAnalysisId) return;
              try {
                await updateAnalysisFeedback(user.uid, lastAnalysisId, rating, note);
              } catch (error: unknown) {
                console.error("Failed to save analysis feedback:", error);
              }
            }}
          />
        )}
      </aside>
      <PrintRoot templateId={printTemplateId} data={data} />
      {templateDialogOpen && (
        <ChangeTemplateDialog
          currentTemplateId={draft.templateId}
          data={data}
          onClose={() => setTemplateDialogOpen(false)}
          onChange={(templateId: TemplateId) => {
            // Only the template changes; data (including style) is untouched.
            // The autosave effect sees the new templateId and saves it.
            templateIdRef.current = templateId;
            setDraft((current) => (current ? { ...current, templateId } : current));
            setSaveStatus("saving");
            setTemplateDialogOpen(false);
          }}
        />
      )}
    </main>
  );
}
