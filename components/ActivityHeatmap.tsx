
import type { ActivityDay } from "@/lib/activity";

type Props = {
  days: ActivityDay[];
};

const colors = [
  "bg-[#ebedf0]",
  "bg-[#9be9a8]",
  "bg-[#40c463]",
  "bg-[#30a14e]",
  "bg-[#216e39]",
];

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function activityLevel(total: number): number {
  if (total === 0) return 0;
  if (total <= 2) return 1;
  if (total <= 5) return 2;
  if (total <= 10) return 3;
  return 4;
}

export default function ActivityHeatmap({ days }: Props) {
  const activityMap = new Map(
    days.map((day) => [day.date, day])
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Include today and the previous 364 days
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - 364);

  // Begin on Sunday so every week has seven rows
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  // End on Saturday
  const gridEnd = new Date(today);
  gridEnd.setDate(today.getDate() + (6 - today.getDay()));

  // Create one column for each week
  const weeks: Date[][] = [];

  const current = new Date(gridStart);

  while (current <= gridEnd) {
    const week: Date[] = [];

    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    weeks.push(week);
  }

  const labels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Activity History
      </h2>

      <p className="mb-5 text-sm text-gray-500">
        Your resume activity over the last 12 months
      </p>

      <div className="overflow-x-auto pb-3">
        <div className="w-max">
          {/* Month labels */}
          <div className="mb-2 flex gap-2">
            <div className="w-8 shrink-0" />

            <div className="flex gap-1">
              {weeks.map((week, index) => {
                const firstOfMonth = week.find(
                  (date) => date.getDate() === 1
                );

                const month =
                  firstOfMonth ??
                  (index === 0 ? week[0] : null);

                return (
                  <div
                    key={index}
                    className="w-3 shrink-0 text-[10px] text-gray-500"
                  >
                    {month
                      ? month.toLocaleDateString("en-US", {
                          month: "short",
                        })
                      : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day labels and activity squares */}
          <div className="flex gap-2">
            <div className="flex w-8 flex-col gap-1">
              {labels.map((label, index) => (
                <div
                  key={index}
                  className="flex h-3 items-center text-[10px] text-gray-500"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex flex-col gap-1"
                >
                  {week.map((date) => {
                    const key = dateKey(date);
                    const day = activityMap.get(key);

                    const edits = day?.edits ?? 0;
                    const exports = day?.exports ?? 0;
                    const analyses = day?.analyses ?? 0;
                    const creates = day?.creates ?? 0;

                    const total =
                      edits + exports + analyses + creates;

                    const level = activityLevel(total);

                    const outsideRange =
                      date < firstDay || date > today;

                    const tooltip =
                      `${date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}: ${edits} edits, ` +
                      `${exports} exports, ` +
                      `${analyses} analyses, ` +
                      `${creates} creates`;

                    return (
                      <div
                        key={key}
                        title={
                          outsideRange ? undefined : tooltip
                        }
                        className={`h-3 w-3 rounded-[2px] ${
                          outsideRange
                            ? "bg-gray-100 opacity-40"
                            : colors[level]
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-end gap-1">
            <span className="mr-1 text-xs text-gray-500">
              Less
            </span>

            {colors.map((color, index) => (
              <div
                key={index}
                className={`h-3 w-3 rounded-[2px] ${color}`}
              />
            ))}

            <span className="ml-1 text-xs text-gray-500">
              More
            </span>
          </div>
        </div>
      </div>

      {days.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">
          No activity yet. Edit a resume and it will show up here.
        </p>
      )}
    </div>
  );
}
