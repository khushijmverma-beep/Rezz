
import { notFound } from "next/navigation";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { scoreResume } from "@/lib/scoring";
import type {
  ResumeData,
  TemplateId,
} from "@/lib/types/resume";

import EvalClient, {
  type EvalRow,
} from "./EvalClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EvalPair = {
  id: string;
  resumeText: string;
  resumeData?: ResumeData;
  jobDescription: string;
  templateId?: TemplateId;
  humanAtsScore: number;
  humanRecruiterScore: number;
  notes?: string;
};

function toHumanScale(score: number): number {
  return 1 + (Math.max(0, Math.min(100, score)) / 100) * 4;
}

async function evaluatePairs(): Promise<{
  rows: EvalRow[];
  errors: string[];
  version: string;
}> {
  const directory = path.join(process.cwd(), "evals", "pairs");
  const files = (await readdir(directory)).filter((file) =>
    file.endsWith(".json")
  );

  const rows: EvalRow[] = [];
  const errors: string[] = [];
  const versions = new Set<string>();

  for (const file of files) {
    try {
      const contents = await readFile(
        path.join(directory, file),
        "utf8"
      );

      const pair = JSON.parse(contents) as EvalPair;

      if (
        !pair.id ||
        !pair.jobDescription ||
        !pair.resumeText ||
        !Number.isFinite(pair.humanAtsScore) ||
        !Number.isFinite(pair.humanRecruiterScore) ||
        pair.humanAtsScore < 1 ||
        pair.humanAtsScore > 5 ||
        pair.humanRecruiterScore < 1 ||
        pair.humanRecruiterScore > 5
      ) {
        throw new Error("Invalid evaluation pair");
      }

      // A structured resume is required for accurate scoring.
      if (!pair.resumeData) {
        throw new Error(
          "Missing resumeData. Add the structured resume fields."
        );
      }

      const result = await scoreResume({
        data: pair.resumeData,
        templateId: pair.templateId ?? "simple",
        jobDescription: pair.jobDescription,
      });

      const ats = result.ats.score;
      const recruiter = result.human.score;

      const version =
        "scorerVersion" in result &&
        typeof result.scorerVersion === "string"
          ? result.scorerVersion
          : "unknown";

      versions.add(version);

      rows.push({
        id: pair.id,
        humanAts: pair.humanAtsScore,
        humanRecruiter: pair.humanRecruiterScore,
        predictedAts: ats,
        predictedRecruiter: recruiter,
        atsError: Math.abs(
          toHumanScale(ats) - pair.humanAtsScore
        ),
        recruiterError: Math.abs(
          toHumanScale(recruiter) -
            pair.humanRecruiterScore
        ),
        version,
        notes: pair.notes ?? "",
      });
    } catch (error) {
      errors.push(
        `${file}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  rows.sort(
    (a, b) =>
      b.atsError +
      b.recruiterError -
      (a.atsError + a.recruiterError)
  );

  return {
    rows,
    errors,
    version:
      versions.size === 1
        ? Array.from(versions)[0]
        : versions.size > 1
          ? "mixed"
          : "unknown",
  };
}

export default async function EvalPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  let data: Awaited<ReturnType<typeof evaluatePairs>>;

  try {
    data = await evaluatePairs();
  } catch (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Scorer Evaluation
        </h1>
        <p className="mt-4 text-red-600">
          Failed to load evaluation files:{" "}
          {error instanceof Error
            ? error.message
            : "Unknown error"}
        </p>
      </main>
    );
  }

  return <EvalClient {...data} />;
}
