

import {
  type ActivityDay,
  activityTotal,
  localDateKey,
} from "@/lib/activity";

type Props = {
  days: ActivityDay[];
};

const colors = [
  "bg-gray-200",
  "bg-green-200",
  "bg-green-400",
  "bg-green-600",
  "bg-green-800",
];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

export default function ActivityHeatmap({ days }: Props) {
  const activity = new Map(days.map((day) => [day.date, day]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const dates: Date[] = [];
  const cursor = new Date(gridStart);

  while (cursor <= today) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks: Date[][] = [];

  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">
        Activity History
      </h2>

      <p className="mb-5 mt-1 text-sm text-gray-500">
        Your resume activity over the last 365 days
      </p>

      <div className="overflow-x-auto">
        <div className="flex w-max gap-1 pb-3">
          {weeks.map((week, index) => (
            <div key={index} className="flex flex-col gap-1">
              {week.map((date) => {
                const key = localDateKey(date);
                const entry = activity.get(key);

                const count = entry
                  ? activityTotal(entry)
                  : 0;

                const inactive = date < start || date > today;

                const tooltip = [
                  date.toLocaleDateString(),
                  `${entry?.edits ?? 0} edits`,
                  `${entry?.exports ?? 0} exports`,
                  `${entry?.analyses ?? 0} analyses`,
                  `${entry?.creates ?? 0} creates`,
                ].join(" | ");

                return (
                  <div
                    key={key}
                    title={inactive ? undefined : tooltip}
                    aria-label={tooltip}
                    className={`h-3 w-3 rounded-sm ${
                      inactive
                        ? "bg-gray-100"
                        : colors[getLevel(count)]
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gray-500">
        <span>Less</span>
        {colors.map((color, index) => (
          <span
            key={index}
            className={`h-3 w-3 rounded-sm ${color}`}
          />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}
