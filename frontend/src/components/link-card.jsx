import { StarIcon, TrashIcon, ExternalIcon, PdfIcon } from "./components";
import { Favicon } from "./components";

const CAT_COLORS = {
  Work: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  Personal: "bg-pink-500/15 text-pink-300 border border-pink-500/20",
  "Reading List": "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  Inspiration: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  Other: "bg-slate-500/15 text-slate-400 border border-slate-600/20",
};

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

function fmtDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const BANNER_PALETTES = [
  { from: "#1e1b4b", via: "#3730a3", to: "#0f172a", accent: "#818cf8", glow: "99,102,241" },
  { from: "#082f49", via: "#0369a1", to: "#0f172a", accent: "#38bdf8", glow: "56,189,248" },
  { from: "#3b0764", via: "#7e22ce", to: "#0f172a", accent: "#c084fc", glow: "192,132,252" },
  { from: "#052e16", via: "#15803d", to: "#0f172a", accent: "#4ade80", glow: "74,222,128" },
  { from: "#431407", via: "#c2410c", to: "#0f172a", accent: "#fb923c", glow: "251,146,60" },
  { from: "#4c0519", via: "#be123c", to: "#0f172a", accent: "#fb7185", glow: "251,113,133" },
  { from: "#422006", via: "#a16207", to: "#0f172a", accent: "#facc15", glow: "250,204,21" },
  { from: "#042f2e", via: "#0f766e", to: "#0f172a", accent: "#2dd4bf", glow: "45,212,191" },
];

function getBannerPalette(url) {
  return BANNER_PALETTES[hashString(getDomain(url)) % BANNER_PALETTES.length];
}

function openInNewTab(url) {
  if (!url) return;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) {
    win.opener = null;
  }
}

// ============================================================================
// LIST VIEW CARD
// ============================================================================

export function LinkCardList({
  link,
  onVisit,
  onOpenDetails,
  onDelete,
  onToggleStar,
  isAuthenticated,
  requireAuth,
}) {
  const domain = getDomain(link.url);
  const pdf = isPdfUrl(link.url);

  const openLink = (event) => {
    event?.stopPropagation();
    onVisit(link._id);
    openInNewTab(link.url);
  };

  const toggleStar = (event) => {
    event.stopPropagation();
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    onToggleStar(link._id);
  };

  const deleteLink = (event) => {
    event.stopPropagation();
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    onDelete(link._id);
  };

  const details = (event) => {
    event.stopPropagation();
    onOpenDetails(link);
  };

  return (
    <div
      className="group flex items-center gap-3 sm:gap-4 px-4 py-3.5 rounded-2xl cursor-pointer bg-slate-900 border border-white/[0.06] hover:-translate-y-0.5 hover:border-indigo-400/30 hover:shadow-xl hover:shadow-black/30 transition-all duration-300"
      onClick={openLink}
    >
      <div className="group-hover:scale-105 transition-transform">
        <Favicon url={link.url} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-sm truncate text-slate-200 group-hover:text-indigo-300">
            {link.title}
          </p>

          {link.starred && (
            <StarIcon filled className="w-3.5 h-3.5 text-amber-400" />
          )}

          {pdf && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
              PDF
            </span>
          )}

          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              CAT_COLORS[link.category] || "bg-slate-500/15 text-slate-300"
            }`}
          >
            {link.category}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-500">{domain}</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500">
            {fmtDate(link.savedAt)}
          </span>

          {link.note && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500 truncate max-w-[8rem] italic">
                "{link.note}"
              </span>
            </>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={toggleStar}
          className={`hidden sm:flex w-8 h-8 items-center justify-center rounded-lg ${
            link.starred
              ? "text-amber-400"
              : "text-slate-600 hover:text-amber-400"
          }`}
        >
          <StarIcon filled={link.starred} />
        </button>

        <button
          type="button"
          onClick={details}
          className="hidden sm:flex px-3 py-1.5 text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg"
        >
          Details
        </button>

        <button
          type="button"
          onClick={openLink}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg"
          style={{
            background: `rgba(${getBannerPalette(link.url).glow},0.12)`,
            color: getBannerPalette(link.url).accent,
            border: `1px solid rgba(${getBannerPalette(link.url).glow},0.2)`,
          }}
        >
          {pdf ? (
            <PdfIcon className="w-3.5 h-3.5" />
          ) : (
            <ExternalIcon className="w-3.5 h-3.5" />
          )}
          {pdf ? "View PDF" : "Visit"}
        </button>

        <button
          type="button"
          onClick={deleteLink}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// GRID VIEW CARD
// ============================================================================

export function LinkCardGrid({
  link,
  onVisit,
  onOpenDetails,
  onDelete,
  onToggleStar,
  isAuthenticated,
  requireAuth,
}) {
  const domain = getDomain(link.url);
  const palette = getBannerPalette(link.url);
  const pdf = isPdfUrl(link.url);

  const openLink = (event) => {
    event?.stopPropagation();
    onVisit(link._id);
    openInNewTab(link.url);
  };

  const toggleStar = (event) => {
    event.stopPropagation();
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    onToggleStar(link._id);
  };

  const deleteLink = (event) => {
    event.stopPropagation();
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    onDelete(link._id);
  };

  const details = (event) => {
    event.stopPropagation();
    onOpenDetails(link);
  };

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-[20px] bg-[#0f1623] border border-white/[0.06] hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50 transition-all duration-300"
      onClick={openLink}
    >
      {/* Banner */}
      <div className="relative h-32 sm:h-36 overflow-hidden rounded-t-[20px]">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${palette.from}, ${palette.via} 55%, ${palette.to})`,
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,.14) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-16"
          style={{
            background: "linear-gradient(to top, #0f1623 0%, transparent 100%)",
          }}
        />

        {/* Hover buttons */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 translate-y-[-6px] group-hover:opacity-100 group-hover:translate-y-0 transition-all">
          <button
            type="button"
            onClick={toggleStar}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white/80"
          >
            <StarIcon filled={link.starred} className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={details}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white/80"
          >
            ⋯
          </button>

          <button
            type="button"
            onClick={deleteLink}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-red-300"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Star badge */}
        {link.starred && (
          <div className="absolute top-2.5 left-2.5 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-amber-400">
            <StarIcon filled className="w-3.5 h-3.5" />
          </div>
        )}

        {/* PDF badge */}
        {pdf && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-white bg-red-600/75">
            <PdfIcon className="w-3 h-3" />
            PDF
          </div>
        )}

        {/* Center button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div
            className="flex items-center gap-1.5 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-full"
            style={{
              background: `rgba(${palette.glow},.75)`,
            }}
          >
            {pdf ? (
              <PdfIcon className="w-3.5 h-3.5" />
            ) : (
              <ExternalIcon className="w-3.5 h-3.5" />
            )}
            {pdf ? "View PDF" : "Open"}
          </div>
        </div>
      </div>

      {/* Favicon separator */}
      <div className="relative h-5 bg-[#0f1623]">
        <div className="absolute -top-5 left-4 w-11 h-11 rounded-xl bg-white border-[3px] border-[#0f1623] flex items-center justify-center p-2 shadow-lg group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform">
          <Favicon url={link.url} size="small" />
        </div>
      </div>

      {/* Content */}
      <div className="pt-2 pb-4 px-4 bg-[#0f1623]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[.1em] text-slate-500 truncate">
            {domain}
          </p>

          <span className="text-slate-700">·</span>

          <span className="text-[10px] text-slate-500">
            👁 {link.visits || 0}
          </span>
        </div>

        <p className="font-bold text-sm leading-snug line-clamp-2 mb-2.5 text-slate-200 group-hover:text-indigo-300">
          {link.title}
        </p>

        {/* Category */}
        <div className="flex flex-wrap gap-1 mb-2">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              CAT_COLORS[link.category] || "bg-slate-500/15 text-slate-300"
            }`}
          >
            {link.category}
          </span>
        </div>

        {/* Tags */}
        {link.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {link.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: `rgba(${palette.glow},.1)`,
                  color: palette.accent,
                }}
              >
                #{tag}
              </span>
            ))}

            {link.tags.length > 3 && (
              <span className="text-[10px] text-slate-500">
                +{link.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Note */}
        {link.note && (
          <p className="text-[11px] italic line-clamp-1 mb-2 text-slate-500">
            "{link.note}"
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.05]">
          <span className="text-[10px] text-slate-500">
            {fmtDate(link.savedAt)}
          </span>

          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={openLink}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400"
            >
              {pdf ? (
                <PdfIcon className="w-4 h-4" />
              ) : (
                <ExternalIcon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={deleteLink}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
