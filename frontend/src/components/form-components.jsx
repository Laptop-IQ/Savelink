import { useState, useEffect } from "react";
import { LinkIcon } from "./components";

// ============================================================================
// SEARCH INPUT
// ============================================================================

export function SearchInput({ value, onChange, onClear, placeholder = "Search…" }) {
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
        placeholder={placeholder}
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
// SELECT DROPDOWN
// ============================================================================

export function SelectInput({ value, onChange, options, label = null }) {
  return (
    <div>
      {label && (
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-900">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// TEXT INPUT
// ============================================================================

export function TextInput({
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  onKeyDown,
  autoFocus = false,
  icon = null,
  error = null,
  readOnly = false,
}) {
  return (
    <div>
      {label && (
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500">
            {icon}
          </div>
        )}

        <input
          autoFocus={autoFocus}
          type={type}
          readOnly={readOnly}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
            readOnly ? "cursor-not-allowed opacity-60" : ""
          }`}
        />
      </div>

      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

// ============================================================================
// TEXTAREA
// ============================================================================

export function TextArea({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onClick,
  readOnly = false,
  rows = 2,
}) {
  return (
    <div>
      {label && (
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
          {label}
        </label>
      )}

      <textarea
        rows={rows}
        readOnly={readOnly}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onClick={onClick}
        className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 resize-none text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      />
    </div>
  );
}

// ============================================================================
// CATEGORY SELECTOR
// ============================================================================

export function CategorySelector({ value, onChange, categories, interactive = true }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange(cat)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            value === cat
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-slate-700 text-slate-400 hover:border-indigo-500/50"
          } ${!interactive ? "cursor-not-allowed opacity-50" : ""}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// TAG INPUT & DISPLAY
// ============================================================================

export function TagDisplay({ tags = [], onRemove = null }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium px-2.5 py-1 rounded-full"
        >
          #{tag}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="text-indigo-400/70 hover:text-indigo-200"
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export function TagInput({ value, onAdd, onKeyDown, placeholder, readOnly = false }) {
  return (
    <input
      value={value}
      readOnly={readOnly}
      onChange={(e) => e.currentTarget.value}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === ",") && !readOnly) {
          e.preventDefault();
          onAdd();
        }
      }}
      placeholder={placeholder}
      className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
    />
  );
}

// ============================================================================
// INFO GRID CARD
// ============================================================================

export function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-800/60 rounded-xl px-3 py-2.5">
      <p className="text-xs text-slate-500 font-medium mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

// ============================================================================
// LINK PREVIEW CARD
// ============================================================================

export function LinkPreview({ url, domain, isPdf, favicon }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/40 border border-slate-800 rounded-xl">
      {favicon}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {isPdf ? "PDF document" : domain}
        </p>

        <p className="text-xs text-slate-500 truncate">{url}</p>
      </div>

      {isPdf && (
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
          PDF
        </span>
      )}
    </div>
  );
}
