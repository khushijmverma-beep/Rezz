
"use client";

type SortBy = "updatedAt" | "createdAt" | "title";
type ViewMode = "grid" | "list";

type HomeToolbarProps = {
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
  descending: boolean;
  onToggleOrder: () => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
};

export default function HomeToolbar({
  sortBy,
  onSortByChange,
  descending,
  onToggleOrder,
  viewMode,
  onViewModeChange,
}: HomeToolbarProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        Sort by
        <select
          value={sortBy}
          onChange={(event) =>
            onSortByChange(event.target.value as SortBy)
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
        >
          <option value="updatedAt">Last modified</option>
          <option value="createdAt">Date created</option>
          <option value="title">Title</option>
        </select>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleOrder}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          aria-label="Toggle sort order"
        >
          {sortBy === "title"
            ? descending ? "Z–A" : "A–Z"
            : descending ? "Newest first" : "Oldest first"}
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("grid")}
          aria-label="Grid view"
          aria-pressed={viewMode === "grid"}
          className={`rounded-lg border px-3 py-2 text-sm ${
            viewMode === "grid"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          ▦
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          aria-label="List view"
          aria-pressed={viewMode === "list"}
          className={`rounded-lg border px-3 py-2 text-sm ${
            viewMode === "list"
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          ☰
        </button>
      </div>
    </div>
  );
}

