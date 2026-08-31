// ============================================================================
// CONSTANTS
// ============================================================================

export const CATEGORIES = [
  "All",
  "Work",
  "Personal",
  "Reading List",
  "Inspiration",
  "Other",
];

export const SORT_OPTIONS = [
  "Newest",
  "Oldest",
  "Name A–Z",
  "Name Z–A",
  "Most visited",
];

export const CAT_COLORS = {
  Work: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  Personal: "bg-pink-500/15 text-pink-300 border border-pink-500/20",
  "Reading List":
    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
  Inspiration: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
  Other: "bg-slate-500/15 text-slate-400 border border-slate-600/20",
};

export const BANNER_PALETTES = [
  {
    from: "#1e1b4b",
    via: "#3730a3",
    to: "#0f172a",
    accent: "#818cf8",
    glow: "99,102,241",
  },
  {
    from: "#082f49",
    via: "#0369a1",
    to: "#0f172a",
    accent: "#38bdf8",
    glow: "56,189,248",
  },
  {
    from: "#3b0764",
    via: "#7e22ce",
    to: "#0f172a",
    accent: "#c084fc",
    glow: "192,132,252",
  },
  {
    from: "#052e16",
    via: "#15803d",
    to: "#0f172a",
    accent: "#4ade80",
    glow: "74,222,128",
  },
  {
    from: "#431407",
    via: "#c2410c",
    to: "#0f172a",
    accent: "#fb923c",
    glow: "251,146,60",
  },
  {
    from: "#4c0519",
    via: "#be123c",
    to: "#0f172a",
    accent: "#fb7185",
    glow: "251,113,133",
  },
  {
    from: "#422006",
    via: "#a16207",
    to: "#0f172a",
    accent: "#facc15",
    glow: "250,204,21",
  },
  {
    from: "#042f2e",
    via: "#0f766e",
    to: "#0f172a",
    accent: "#2dd4bf",
    glow: "45,212,191",
  },
];

// ============================================================================
// URL & DOMAIN UTILITIES
// ============================================================================

export function normalizeUrl(raw) {
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

export function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url || "";
  }
}

export function isPdfUrl(url) {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

export function getFaviconUrl(url) {
  const domain = getDomain(url);

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    domain,
  )}&sz=128`;
}

export function guessTitleFromUrl(url) {
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

export function openInNewTab(url) {
  if (!url) return;

  const win = window.open(url, "_blank", "noopener,noreferrer");

  if (win) {
    win.opener = null;
  }
}

// ============================================================================
// ID & HASHING
// ============================================================================

export function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function hashString(value) {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getBannerPalette(url) {
  return BANNER_PALETTES[hashString(getDomain(url)) % BANNER_PALETTES.length];
}

// ============================================================================
// LINK NORMALIZATION
// ============================================================================

export function normalizeLink(link) {
  if (!link || typeof link !== "object") return null;

  return {
    ...link,
    _id: String(link._id || link.id || createId()),
    title: String(link.title || "Untitled Link"),
    url: String(link.url || ""),
    category: link.category || "Other",
    tags: Array.isArray(link.tags) ? link.tags : [],
    note: String(link.note || ""),
    savedAt: link.savedAt || new Date().toISOString(),
    starred: Boolean(link.starred),
    visits: Number(link.visits || 0),
  };
}

// ============================================================================
// FORMATTING
// ============================================================================

export function fmtDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateFull(value) {
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

// ============================================================================
// FILTERING
// ============================================================================

export function filterAndSortLinks(links, { search, category, sort, onlyStarred }) {
  const query = search.trim().toLowerCase();

  const filtered = links.filter((link) => {
    const matchesSearch =
      !query ||
      link.title.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query) ||
      link.note.toLowerCase().includes(query) ||
      link.tags.some((tag) => String(tag).toLowerCase().includes(query));

    const matchesCategory = category === "All" || link.category === category;

    const matchesStarred = !onlyStarred || Boolean(link.starred);

    return matchesSearch && matchesCategory && matchesStarred;
  });

  return filtered.sort((a, b) => {
    switch (sort) {
      case "Oldest":
        return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();

      case "Name A–Z":
        return a.title.localeCompare(b.title);

      case "Name Z–A":
        return b.title.localeCompare(a.title);

      case "Most visited":
        return (b.visits || 0) - (a.visits || 0);

      default:
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    }
  });
}
