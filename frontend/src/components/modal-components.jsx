import { useState, useEffect } from "react";
import { LinkIcon } from "./components";
import { Favicon } from "./components";
import { TextInput, TextArea, CategorySelector, TagDisplay } from "./form-components";
import { StarIcon, TrashIcon } from "./components";

// ============================================================================
// ADD LINK MODAL
// ============================================================================

function normalizeUrl(raw) {
  let value = String(raw || "").trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url || "";
  }
}

function isPdfUrl(url) {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

function guessTitleFromUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    const last = path.split("/").filter(Boolean).pop();

    if (last) {
      return last
        .replace(/[-_]+/g, " ")
        .replace(/\.\w+$/, "")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return getDomain(url).replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return url;
  }
}

export function AddLinkModal({ onClose, onSave, categories = [] }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [meta, setMeta] = useState({
    category: "Other",
    tags: "",
    note: "",
  });

  const normalizedUrl = normalizeUrl(url);

  useEffect(() => {
    if (!normalizedUrl || titleEdited) return;
    setTitle(guessTitleFromUrl(normalizedUrl));
  }, [normalizedUrl, titleEdited]);

  const submit = async () => {
    if (!normalizedUrl) return;

    const success = await onSave({
      url: normalizedUrl,
      title: title.trim() || guessTitleFromUrl(normalizedUrl),
      ...meta,
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/50 w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Save a link</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Saved to local browser (login to sync to cloud)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 space-y-4">
          <TextInput
            autoFocus
            label="URL"
            placeholder="paste any link — example.com/article"
            value={url}
            onChange={setUrl}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            icon={<LinkIcon />}
            error={url && !normalizedUrl ? "That doesn't look like a valid link." : null}
          />

          {normalizedUrl && (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/40 border border-slate-800 rounded-xl">
              <Favicon url={normalizedUrl} size="small" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {isPdfUrl(normalizedUrl)
                    ? "PDF document"
                    : getDomain(normalizedUrl)}
                </p>

                <p className="text-xs text-slate-500 truncate">
                  {normalizedUrl}
                </p>
              </div>

              {isPdfUrl(normalizedUrl) && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
                  PDF
                </span>
              )}
            </div>
          )}

          <TextInput
            label="Title (auto-filled, edit freely)"
            placeholder="Link title"
            value={title}
            onChange={(value) => {
              setTitle(value);
              setTitleEdited(true);
            }}
          />

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Category
            </label>

            <select
              value={meta.category}
              onChange={(e) =>
                setMeta((current) => ({
                  ...current,
                  category: e.target.value,
                }))
              }
              className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {categories
                .filter((item) => item !== "All")
                .map((item) => (
                  <option key={item} className="bg-slate-800">
                    {item}
                  </option>
                ))}
            </select>
          </div>

          <TextInput
            label="Tags (comma separated)"
            placeholder="e.g. design, read-later, react"
            value={meta.tags}
            onChange={(value) =>
              setMeta((current) => ({
                ...current,
                tags: value,
              }))
            }
          />

          <TextArea
            label="Note"
            placeholder="Add a short note…"
            value={meta.note}
            onChange={(value) =>
              setMeta((current) => ({
                ...current,
                note: value,
              }))
            }
            rows={2}
          />

          <button
            type="button"
            onClick={submit}
            disabled={!normalizedUrl}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl"
          >
            {normalizedUrl ? "Save link" : "Paste a link to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DETAILS SIDEBAR
// ============================================================================

function fmtDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateFull(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function openInNewTab(url) {
  if (!url) return;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) {
    win.opener = null;
  }
}

export function DetailsSidebar({
  link,
  onClose,
  onDelete,
  onRename,
  onToggleStar,
  onUpdateNote,
  onUpdateCategory,
  onAddTag,
  onRemoveTag,
  onVisit,
  isAuthenticated,
  requireAuth,
  categories = [],
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [note, setNote] = useState(link.note);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    setTitle(link.title);
    setNote(link.note || "");
    setEditing(false);
  }, [link._id, link.title, link.note]);

  const openLink = () => {
    if (isAuthenticated) {
      onVisit(link._id);
    }
    openInNewTab(link.url);
  };

  const saveTitle = () => {
    if (!requireAuth()) return;

    const value = title.trim();
    if (!value) return;

    if (value !== link.title) {
      onRename(link._id, value);
    }

    setEditing(false);
  };

  const handleAddTag = () => {
    if (!requireAuth()) return;

    const tag = tagInput.trim().replace(/,/g, "");
    if (!tag) return;

    onAddTag(link._id, tag);
    setTagInput("");
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[210] w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl shadow-black/50 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100">Link Details</h2>
          {!isAuthenticated && (
            <p className="text-[10px] text-amber-400 mt-0.5">
              Login to permanently save edits
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Open button */}
        <button
          type="button"
          onClick={openLink}
          className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-slate-800 hover:border-indigo-500/40"
        >
          <div className="text-center">
            <div className="mx-auto mb-3">
              <Favicon url={link.url} size="large" />
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {getDomain(link.url)}
            </p>

            <p className="text-xs text-indigo-400 font-semibold mt-1">
              Open in new tab →
            </p>
          </div>
        </button>

        {/* Title edit */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Title
          </label>

          {editing ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") {
                    setTitle(link.title);
                    setEditing(false);
                  }
                }}
                className="flex-1 text-sm bg-slate-800 border border-indigo-500/50 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
              />

              <button
                type="button"
                onClick={saveTitle}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-100 flex-1 break-all">
                {link.title}
              </p>

              <button
                type="button"
                onClick={() => {
                  if (!requireAuth()) return;
                  setEditing(true);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10"
              >
                ✎
              </button>
            </div>
          )}
        </div>

        {/* URL */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            URL
          </label>

          <button
            type="button"
            onClick={openLink}
            className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline break-all text-left"
          >
            {link.url}
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Visits", link.visits || 0],
            ["Saved", fmtDate(link.savedAt)],
            ["Category", link.category],
            ["Starred", link.starred ? "Yes" : "No"],
          ].map(([label, value]) => (
            <div key={label} className="bg-slate-800/60 rounded-xl px-3 py-2.5">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                {label}
              </p>
              <p className="text-sm font-semibold text-slate-100">{value}</p>
            </div>
          ))}
        </div>

        {/* Category selector */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Category
          </label>

          <CategorySelector
            value={link.category}
            onChange={(cat) => {
              if (!requireAuth()) return;
              onUpdateCategory(link._id, cat);
            }}
            categories={categories.filter((item) => item !== "All")}
            interactive={isAuthenticated}
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Note
          </label>

          <textarea
            rows={3}
            value={note}
            readOnly={!isAuthenticated}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (isAuthenticated && note !== (link.note || "")) {
                onUpdateNote(link._id, note);
              }
            }}
            onClick={() => {
              if (!isAuthenticated) requireAuth();
            }}
            placeholder="Add a note…"
            className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 resize-none text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Tags
          </label>

          <TagDisplay tags={link.tags || []} onRemove={
            isAuthenticated
              ? (tag) => {
                  if (!requireAuth()) return;
                  onRemoveTag(link._id, tag);
                }
              : null
          } />

          <input
            value={tagInput}
            readOnly={!isAuthenticated}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === ",") && !isAuthenticated) return;
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            onClick={() => {
              if (!isAuthenticated) requireAuth();
            }}
            placeholder={
              isAuthenticated ? "Type tag + Enter" : "Login to edit tags"
            }
            className="w-full text-sm bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 mt-2"
          />
        </div>

        <p className="text-xs text-slate-500 text-center">
          {fmtDateFull(link.savedAt)}
        </p>
      </div>

      {/* Action buttons */}
      <div className="px-5 py-4 border-t border-slate-800 space-y-2">
        <button
          type="button"
          onClick={() => {
            if (!requireAuth()) return;
            onToggleStar(link._id);
          }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border ${
            link.starred
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "border-slate-700 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <StarIcon filled={link.starred} />
          {link.starred ? "Unstar link" : "Star link"}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!requireAuth()) return;
            onDelete(link._id);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
        >
          <TrashIcon />
          Delete link
        </button>
      </div>
    </div>
  );
}
