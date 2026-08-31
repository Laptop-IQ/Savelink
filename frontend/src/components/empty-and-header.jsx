import { LinkIcon } from "./components";

// ============================================================================
// EMPTY STATE
// ============================================================================

export function EmptyState({ query, onAdd, isAuthenticated, requireAuth }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-4">
        <LinkIcon className="w-10 h-10 text-indigo-400/70" />
      </div>

      {query ? (
        <>
          <h3 className="text-lg font-bold text-slate-200 mb-1">
            No results for "{query}"
          </h3>

          <p className="text-sm text-slate-500">
            Try a different keyword, tag, or category.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-slate-200 mb-1">
            No links yet
          </h3>

          <p className="text-sm text-slate-500 mb-6">
            Save your first link — it's stored locally while browsing.
          </p>

          <button
            type="button"
            onClick={() => {
              if (!requireAuth()) return;
              onAdd();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-indigo-950/50"
          >
            <span className="text-lg leading-none">+</span>
            Save a link
          </button>
        </>
      )}
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================

export function Header({ 
  isAuthenticated, 
  linkCount, 
  onClearAll, 
  onAddNew, 
  requireAuth 
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950/60">
          <LinkIcon className="w-5 h-5 text-white" />
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Link Manager
            </h1>

            {!isAuthenticated && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Guest Mode
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-slate-400">
            {isAuthenticated
              ? "Saved to cloud and browser"
              : "Links saved locally (login to sync)"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {linkCount > 0 && (
          <button
            type="button"
            onClick={() => {
              if (!requireAuth()) return;
              onClearAll();
            }}
            className="px-3 py-2.5 border border-red-500/20 text-red-400/80 text-xs font-medium rounded-xl hover:bg-red-500/10"
          >
            Clear All
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (!requireAuth()) return;
            onAddNew();
          }}
          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-950/60"
        >
          <span className="text-lg leading-none">+</span>
          Save Link
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// FILTER BAR
// ============================================================================

export function FilterBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  onlyStarred,
  onToggleStarred,
  layout,
  onLayoutChange,
  sortOptions,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <SearchInputComponent
        value={search}
        onChange={onSearchChange}
        onClear={() => onSearchChange("")}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300"
        >
          {sortOptions.map((option) => (
            <option key={option} className="bg-slate-900">
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onToggleStarred(!onlyStarred)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-medium ${
            onlyStarred
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "border-slate-800 text-slate-400 hover:bg-slate-900"
          }`}
        >
          ★ Starred
        </button>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {["grid", "list"].map((view) => (
            <button
              type="button"
              key={view}
              onClick={() => onLayoutChange(view)}
              className={`px-3 py-2.5 ${
                layout === view
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              {view === "grid" ? "▦" : "☰"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchInputComponent({ value, onChange, onClear }) {
  return (
    <div className="relative flex-1">
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        type="text"
        placeholder="Search by title, URL, tag, or note…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ============================================================================
// CATEGORY TABS
// ============================================================================

export function CategoryTabs({ 
  active, 
  onChange, 
  categories 
}) {
  return (
    <div
      className="flex items-center gap-2 mb-5 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {categories.map((item) => (
        <button
          type="button"
          key={item}
          onClick={() => onChange(item)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border ${
            active === item
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-slate-900 text-slate-400 border-slate-800 hover:border-indigo-500/40"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// LINK COUNT & STATUS
// ============================================================================

export function LinkCountBar({ filtered, total, saving, syncing }) {
  return (
    <>
      {total > 0 && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 font-medium">
            {filtered} of {total} link
            {total !== 1 ? "s" : ""}
          </p>

          {(saving || syncing) && (
            <p className="text-xs text-indigo-400 font-semibold animate-pulse">
              {saving ? "Saving…" : "Syncing…"}
            </p>
          )}
        </div>
      )}
    </>
  );
}
