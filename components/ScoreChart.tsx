
import type { SavedAnalysis } from "@/lib/activity";

type Props = {
  analyses: SavedAnalysis[];
};

export default function ScoreChart({ analyses }: Props) {
  // Show a message when there are no saved analyses
  if (analyses.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">
          AI Match Scores
        </h2>
        <p className="mt-3 text-sm text-gray-500">
          No analyses yet. Analyze a resume to see your scores here.
        </p>
      </div>
    );
  }

  // Chart dimensions
  const width = 800;
  const height = 320;

  const left = 55;
  const right = 25;
  const top = 25;
  const bottom = 60;

  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  // Convert scores to vertical positions
  function getY(score: number): number {
    const safeScore = Number.isFinite(score)
      ? Math.max(0, Math.min(100, score))
      : 0;

    return top + ((100 - safeScore) / 100) * chartHeight;
  }

  // Convert analysis order to horizontal positions
  function getX(index: number): number {
    if (analyses.length === 1) {
      return left + chartWidth / 2;
    }

    return left + (index / (analyses.length - 1)) * chartWidth;
  }

  // Format the date for the horizontal axis
  function formatDate(timestamp: number): string {
    if (!timestamp) return "Unknown";

    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // Create points for the line
  const points = analyses
    .map(
      (analysis, index) =>
        `${getX(index)},${getY(analysis.matchScore)}`
    )
    .join(" ");

  // Show at most five date labels to avoid crowding
  const labelIndexes = new Set<number>();

  const labelCount = Math.min(5, analyses.length);

  for (let i = 0; i < labelCount; i++) {
    const index =
      labelCount === 1
        ? 0
        : Math.round(
            (i * (analyses.length - 1)) / (labelCount - 1)
          );

    labelIndexes.add(index);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        AI Match Scores
      </h2>

      <p className="mb-5 text-sm text-gray-500">
        Track your resume match scores over time
      </p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[600px]"
          role="img"
          aria-label="Line graph of AI resume match scores"
        >
          {/* Horizontal gridlines and score labels */}
          {[0, 25, 50, 75, 100].map((score) => {
            const y = getY(score);

            return (
              <g key={score}>
                <line
                  x1={left}
                  y1={y}
                  x2={width - right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />

                <text
                  x={left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {score}
                </text>
              </g>
            );
          })}

          {/* Vertical axis */}
          <line
            x1={left}
            y1={top}
            x2={left}
            y2={top + chartHeight}
            stroke="#9ca3af"
          />

          {/* Horizontal axis */}
          <line
            x1={left}
            y1={top + chartHeight}
            x2={width - right}
            y2={top + chartHeight}
            stroke="#9ca3af"
          />

          {/* Connect analysis points */}
          {analyses.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Display dots and hover tooltips */}
          {analyses.map((analysis, index) => {
            const x = getX(index);
            const y = getY(analysis.matchScore);

            return (
              <g key={analysis.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#16a34a"
                  stroke="white"
                  strokeWidth="2"
                >
                  <title>
                    {`${analysis.draftTitle}
Score: ${analysis.matchScore}%
Date: ${formatDate(analysis.createdAt)}`}
                  </title>
                </circle>

                {/* Date labels */}
                {labelIndexes.has(index) && (
                  <text
                    x={x}
                    y={height - 32}
                    fontSize="11"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {formatDate(analysis.createdAt)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Hover over a point to see the resume title and score.
      </p>
    </div>
  );
}
