
import type { SavedAnalysis } from "@/lib/activity";

type Props = {
  analyses: SavedAnalysis[];
};

type ScoreKey = "atsScore" | "humanScore";

const series: {
  key: ScoreKey;
  label: string;
  color: string;
}[] = [
  { key: "atsScore", label: "ATS Score", color: "#2563eb" },
  { key: "humanScore", label: "Recruiter Score", color: "#16a34a" },
];

export default function ScoreChart({ analyses }: Props) {
  const scans = [...analyses].sort(
    (a, b) => a.createdAt - b.createdAt
  );

  const width = 800;
  const height = 320;
  const left = 55;
  const right = 30;
  const top = 25;
  const bottom = 55;

  const graphWidth = width - left - right;
  const graphHeight = height - top - bottom;

  const x = (index: number) =>
    scans.length === 1
      ? left + graphWidth / 2
      : left + (index / Math.max(1, scans.length - 1)) * graphWidth;

  const y = (score: number) =>
    top +
    ((100 - Math.max(0, Math.min(100, score))) / 100) *
      graphHeight;

  const hasScores = scans.some(
    (scan) =>
      scan.atsScore !== undefined ||
      scan.humanScore !== undefined
  );

  function pathsFor(key: ScoreKey): string[] {
    const paths: string[] = [];
    let current: string[] = [];

    scans.forEach((scan, index) => {
      const score = scan[key];

      if (score === undefined) {
        if (current.length) paths.push(current.join(" "));
        current = [];
      } else {
        current.push(`${x(index)},${y(score)}`);
      }
    });

    if (current.length) paths.push(current.join(" "));
    return paths;
  }

  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">
        ATS and Recruiter Scores
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        See how your selected resume improves after each scan.
      </p>

      {!hasScores ? (
        <p className="mt-6 text-sm text-gray-500">
          No ATS or Recruiter scores yet. Run an analysis to
          start tracking your progress.
        </p>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="min-w-[550px] w-full"
              role="img"
              aria-label="ATS and Recruiter scores over time"
            >
              {[0, 25, 50, 75, 100].map((score) => (
                <g key={score}>
                  <line
                    x1={left}
                    x2={width - right}
                    y1={y(score)}
                    y2={y(score)}
                    stroke="#e5e7eb"
                  />
                  <text
                    x={left - 12}
                    y={y(score) + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {score}
                  </text>
                </g>
              ))}

              {series.map((item) => (
                <g key={item.key}>
                  {pathsFor(item.key).map((points, index) => (
                    <polyline
                      key={index}
                      points={points}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}

                  {scans.map((scan, index) => {
                    const score = scan[item.key];
                    if (score === undefined) return null;

                    return (
                      <circle
                        key={`${scan.id}-${item.key}`}
                        cx={x(index)}
                        cy={y(score)}
                        r="5"
                        fill={item.color}
                        stroke="white"
                        strokeWidth="2"
                      >
                        <title>
                          {`${item.label}: ${score}/100
${new Date(scan.createdAt).toLocaleDateString()}
${scan.jobTitle || scan.draftTitle}`}
                        </title>
                      </circle>
                    );
                  })}
                </g>
              ))}

              {scans.map((scan, index) => {
                if (
                  scans.length > 6 &&
                  index % Math.ceil(scans.length / 6) !== 0 &&
                  index !== scans.length - 1
                ) {
                  return null;
                }

                return (
                  <text
                    key={scan.id}
                    x={x(index)}
                    y={height - 22}
                    fontSize="11"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {scan.createdAt
                      ? new Date(scan.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )
                      : "Unknown"}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-5 text-sm">
            {series.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

