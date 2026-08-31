// ============================================================================
// ICONS (Reusable SVG components)
// ============================================================================

export function LinkIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

export function StarIcon({ filled = false, className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

export function TrashIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export function ExternalIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

export function PdfIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M14 3v6h6M8.5 15.5h1.2a1.5 1.5 0 000-3H8.5v5M12.5 17.5v-5h1.2a2.5 2.5 0 010 5h-1.2M17.5 12.5h-2v5"
      />
    </svg>
  );
}

export function SearchIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
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
  );
}

export function LockIcon({ className = "w-7 h-7" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm2-9V7a4 4 0 118 0v3"
      />
    </svg>
  );
}

// ============================================================================
// TOAST
// ============================================================================

export function Toast({ message, type = "success" }) {
  const colors =
    type === "error"
      ? "bg-red-950/90 text-red-300 border-red-800/60"
      : type === "warn"
        ? "bg-amber-950/90 text-amber-300 border-amber-800/60"
        : "bg-emerald-950/90 text-emerald-300 border-emerald-800/60";

  const path =
    type === "error"
      ? "M6 18L18 6M6 6l12 12"
      : type === "warn"
        ? "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        : "M5 13l4 4L19 7";

  return (
    <div
      className={`fixed top-4 right-4 z-[300] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl shadow-black/40 text-sm font-medium border backdrop-blur-md ${colors}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={path}
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

// ============================================================================
// FAVICON
// ============================================================================

import { useState, useEffect } from "react";

export function Favicon({ url, size = "normal" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const sizeClass =
    size === "large"
      ? "w-16 h-16 p-3"
      : size === "small"
        ? "w-8 h-8 p-1.5"
        : "w-10 h-10 p-2";

  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname.replace(/^www\./i, "");
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    } catch {
      return "";
    }
  };

  return (
    <div
      className={`${sizeClass} rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden`}
    >
      {!failed ? (
        <img
          src={getFaviconUrl(url)}
          alt=""
          className="w-full h-full object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <LinkIcon
          className={
            size === "large"
              ? "w-7 h-7 text-indigo-400"
              : "w-5 h-5 text-slate-400"
          }
        />
      )}
    </div>
  );
}

// ============================================================================
// MODAL DIALOGS
// ============================================================================

export function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-sm p-6">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
            danger ? "bg-red-500/10" : "bg-indigo-500/10"
          }`}
        >
          {danger ? (
            <TrashIcon className="w-6 h-6 text-red-400" />
          ) : (
            <svg
              className="w-6 h-6 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        <h3 className="text-base font-bold text-slate-100 mb-1">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${
              danger
                ? "bg-red-600 hover:bg-red-500"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoginRequiredModal({ onClose, onLogin }) {
  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-black/60 p-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5">
          <LockIcon />
        </div>

        <h3 id="login-title" className="text-lg font-bold text-slate-100 mb-2">
          Login to save links
        </h3>

        <p className="text-sm leading-6 text-slate-400 mb-6">
          You can browse and open links without logging in. Please login to
          permanently save, edit, star, or delete your links.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogin?.();
            }}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
