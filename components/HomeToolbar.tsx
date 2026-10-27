"use client";

import { LayoutGrid, List } from "lucide-react";

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
  const nextView = viewMode === "grid" ? "list" : "grid";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        Sort by
        <select
          value={sortBy}
          onChange={(event) =>
            onSortByChange(event.target.value as SortBy)
          }
          className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-900"
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
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          aria-label="Toggle sort order"
        >
          {sortBy === "title"
            ? descending
              ? "Z–A"
              : "A–Z"
            : descending
              ? "Newest first"
              : "Oldest first"}
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange(nextView)}
          aria-label={
            nextView === "list"
              ? "Switch to list view"
              : "Switch to grid view"
          }
          title={
            nextView === "list"
              ? "Switch to list view"
              : "Switch to grid view"
          }
          className="rounded-lg border border-gray-300 p-2.5 text-gray-700 transition hover:bg-gray-100"
        >
          {viewMode === "grid" ? (
            <List size={18} aria-hidden="true" />
          ) : (
            <LayoutGrid size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
