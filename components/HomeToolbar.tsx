"use client";

import { ChevronDown, LayoutGrid, List } from "lucide-react";

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
    <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        Sort by
        {/* appearance-none hides the browser's arrow so ours can sit inside the padding. */}
        <span className="relative">
          <select
            value={sortBy}
            onChange={(event) =>
              onSortByChange(event.target.value as SortBy)
            }
            className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-gray-900"
          >
            <option value="updatedAt">Last modified</option>
            <option value="createdAt">Date created</option>
            <option value="title">Title</option>
          </select>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </span>
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
