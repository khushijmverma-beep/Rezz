
import type { SavedAnalysis } from "@/lib/activity";

type Props = {
  analyses: SavedAnalysis[];
};

function getImprovement(
  analyses: SavedAnalysis[],
  field: "atsScore" | "humanScore"
): number | null {
  const valid = [...analyses]
    .filter((scan) => scan[field] !== undefined)
    .sort((a, b) => a.createdAt - b.createdAt);

  if (valid.length < 2) return null;

  return valid[valid.length - 1][field]! - valid[0][field]!;
}

export default function ProgressCard({ analyses }: Props) {
  const atsChange = getImprovement(analyses, "atsScore");
  const recruiterChange = getImprovement(
    analyses,
    "humanScore"
  );

  const format = (value: number | null) => {
    if (value === null) return "N/A";
    return `${value > 0 ? "+" : ""}${value} points`;
  };

  const color = (value: number | null) => {
    if (value === null) return "text-gray-500";
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-700";
  };

  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">
        Improvement Since First Scan
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            ATS Improvement
          </p>
          <p className={`mt-2 text-2xl font-bold ${color(atsChange)}`}>
            {format(atsChange)}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            Recruiter Improvement
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${color(recruiterChange)}`}
          >
            {format(recruiterChange)}
          </p>
        </div>
      </div>

      {analyses.length < 2 && (
        <p className="mt-4 text-sm text-gray-500">
          Scan again after you edit to see progress.
        </p>
      )}
    </section>
  );
}
