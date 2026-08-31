import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast, ConfirmDialog, LoginRequiredModal } from "./components";
import { AddLinkModal, DetailsSidebar } from "./modal-components";
import { LinkCardList, LinkCardGrid } from "./link-card";
import { EmptyState, Header, FilterBar, CategoryTabs, LinkCountBar } from "./empty-and-header";
import {
  CATEGORIES,
  SORT_OPTIONS,
  createId,
  normalizeLink,
  filterAndSortLinks,
} from "./utils";
import {
  dbGetAll,
  dbPut,
  dbPutMany,
  dbDelete,
  dbClear,
  fetchLinksFromServer,
  saveToServer,
  updateOnServer,
  deleteFromServer,
  toggleStarOnServer,
  recordVisitOnServer,
  addTagOnServer,
  removeTagOnServer,
} from "./db-and-api";

const API_BASE = `${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/api`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LinkVault({ user, token, onLogin, apiUrl = API_BASE }) {
  const isAuthenticated = Boolean(user && token);

  // State: Links data
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  // State: UI
  const [detailLink, setDetailLink] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // State: Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [layout, setLayout] = useState("grid");
  const [onlyStarred, setOnlyStarred] = useState(false);

  // State: Dialogs
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  const toastTimer = useRef(null);

  // ========================================================================
  // Helpers
  // ========================================================================

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    setShowLoginRequired(true);
    return false;
  }, [isAuthenticated]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  // ========================================================================
  // Load links on mount or when token changes
  // ========================================================================

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSyncing(true);

      try {
        // Try to fetch from server
        const serverLinks = await fetchLinksFromServer(token, apiUrl);

        if (serverLinks) {
          const normalized = serverLinks.map(normalizeLink).filter(Boolean);

          if (!cancelled) {
            setLinks(normalized);
          }

          // Sync to local cache
          try {
            await dbClear();
            await dbPutMany(normalized);
          } catch (error) {
            console.warn("Local cache sync failed:", error);
          }
        } else {
          // Fall back to local cache
          const cached = await dbGetAll();

          if (!cancelled) {
            setLinks(cached.map(normalizeLink).filter(Boolean));
          }
        }
      } catch (error) {
        console.error("Load error:", error);

        // Final fallback to cache
        try {
          const cached = await dbGetAll();

          if (!cancelled) {
            setLinks(cached.map(normalizeLink).filter(Boolean));
          }
        } catch {
          if (!cancelled) {
            showToast("Could not load your links.", "error");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSyncing(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [token, apiUrl, showToast]);

  // ========================================================================
  // Save new link
  // ========================================================================

  const handleSave = useCallback(
    async ({ url, title, category, tags, note }) => {
      setSaving(true);

      try {
        const payload = {
          url,
          title,
          category,
          note: String(note || "").trim(),
          tags: String(tags || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        };

        let serverLink = null;
        if (isAuthenticated && token) {
          serverLink = await saveToServer(payload, token, apiUrl);
        }

        if (!serverLink) {
          const link = normalizeLink({
            _id: createId(),
            ...payload,
            savedAt: new Date().toISOString(),
            visits: 0,
            starred: false,
          });

          await dbPut(link);
          setLinks((current) => [link, ...current]);
          showToast("Link saved locally!");

          return true;
        }

        const link = normalizeLink(serverLink);
        await dbPut(link);
        setLinks((current) => [link, ...current]);
        showToast("Link saved to cloud!");

        return true;
      } catch (error) {
        console.error("Save error:", error);
        showToast("Could not save link.", "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [isAuthenticated, token, apiUrl, showToast],
  );

  // ========================================================================
  // Delete link
  // ========================================================================

  const deleteLink = useCallback(
    async (id) => {
      const previous = links;

      setLinks((current) => current.filter((link) => link._id !== id));
      setDetailLink((current) => (current?._id === id ? null : current));

      try {
        if (isAuthenticated && token) {
          await deleteFromServer(id, token, apiUrl);
        }

        await dbDelete(id);
        showToast("Link deleted", "error");
      } catch (error) {
        console.error("Delete error:", error);

        setLinks(previous);
        showToast("Delete failed.", "error");
      }
    },
    [links, isAuthenticated, token, apiUrl, showToast],
  );

  const handleDelete = useCallback(
    (id) => {
      if (!requireAuth()) return;
      setConfirmDelete(id);
    },
    [requireAuth],
  );

  const confirmDeleteLink = async () => {
    if (!confirmDelete) return;

    const id = confirmDelete;
    setConfirmDelete(null);

    await deleteLink(id);
  };

  // ========================================================================
  // Clear all links
  // ========================================================================

  const clearAll = async () => {
    if (!requireAuth()) return;

    const previous = links;

    setLinks([]);
    setDetailLink(null);
    setConfirmClear(false);

    try {
      await dbClear();
      showToast("All local links cleared", "warn");
    } catch (error) {
      console.error("Clear error:", error);
      setLinks(previous);
      showToast("Clear failed.", "error");
    }
  };

  // ========================================================================
  // Update link (generic)
  // ========================================================================

  const updateLink = useCallback(
    async (id, changes) => {
      if (!requireAuth()) return false;

      const previous = links;
      const existing = links.find((link) => link._id === id);

      if (!existing) return false;

      const optimistic = normalizeLink({
        ...existing,
        ...changes,
      });

      setLinks((current) =>
        current.map((link) => (link._id === id ? optimistic : link)),
      );

      setDetailLink((current) => (current?._id === id ? optimistic : current));

      try {
        const serverLink = await updateOnServer(id, changes, token, apiUrl);

        const finalLink = normalizeLink(serverLink || optimistic);

        await dbPut(finalLink);

        setLinks((current) =>
          current.map((link) => (link._id === id ? finalLink : link)),
        );

        setDetailLink((current) => (current?._id === id ? finalLink : current));

        return true;
      } catch (error) {
        console.error("Update error:", error);

        setLinks(previous);
        setDetailLink((current) => (current?._id === id ? existing : current));

        showToast("Could not update link.", "error");

        return false;
      }
    },
    [links, requireAuth, token, apiUrl, showToast],
  );

  // ========================================================================
  // Star/Unstar
  // ========================================================================

  const toggleStar = useCallback(
    async (id) => {
      if (!requireAuth()) return;

      const previous = links;
      const link = links.find((item) => item._id === id);

      if (!link) return;

      const optimistic = {
        ...link,
        starred: !link.starred,
      };

      setLinks((current) =>
        current.map((item) => (item._id === id ? optimistic : item)),
      );

      setDetailLink((current) => (current?._id === id ? optimistic : current));

      try {
        const serverLink = await toggleStarOnServer(id, token, apiUrl);

        const finalLink = normalizeLink(serverLink || optimistic);

        await dbPut(finalLink);

        setLinks((current) =>
          current.map((item) => (item._id === id ? finalLink : item)),
        );

        setDetailLink((current) => (current?._id === id ? finalLink : current));
      } catch (error) {
        console.error("Star error:", error);

        setLinks(previous);
        setDetailLink((current) => (current?._id === id ? link : current));

        showToast("Could not update star.", "error");
      }
    },
    [links, requireAuth, token, apiUrl, showToast],
  );

  // ========================================================================
  // Track visits
  // ========================================================================

  const handleVisit = useCallback(
    (id) => {
      const link = links.find((item) => item._id === id);

      if (!link) return;

      const updated = {
        ...link,
        visits: (link.visits || 0) + 1,
      };

      setLinks((current) =>
        current.map((item) => (item._id === id ? updated : item)),
      );

      setDetailLink((current) => (current?._id === id ? updated : current));

      dbPut(updated).catch((error) => {
        console.warn("Visit cache update failed:", error);
      });

      if (isAuthenticated && token) {
        recordVisitOnServer(id, token, apiUrl).catch((error) => {
          console.warn("Visit server update failed:", error);
        });
      }
    },
    [links, isAuthenticated, token, apiUrl],
  );

  // ========================================================================
  // Tags
  // ========================================================================

  const addTag = useCallback(
    async (id, tag) => {
      if (!requireAuth()) return;

      const cleanTag = tag.trim();

      if (!cleanTag) return;

      const link = links.find((item) => item._id === id);

      if (!link) return;

      const tags = link.tags || [];

      if (tags.some((item) => item.toLowerCase() === cleanTag.toLowerCase())) {
        return;
      }

      const optimistic = {
        ...link,
        tags: [...tags, cleanTag],
      };

      setLinks((current) =>
        current.map((item) => (item._id === id ? optimistic : item)),
      );

      setDetailLink((current) => (current?._id === id ? optimistic : current));

      try {
        const serverLink = await addTagOnServer(id, cleanTag, token, apiUrl);

        const finalLink = normalizeLink(serverLink || optimistic);

        await dbPut(finalLink);

        setLinks((current) =>
          current.map((item) => (item._id === id ? finalLink : item)),
        );

        setDetailLink((current) => (current?._id === id ? finalLink : current));
      } catch (error) {
        console.error("Add tag error:", error);
        showToast("Could not add tag.", "error");
      }
    },
    [links, requireAuth, token, apiUrl, showToast],
  );

  const removeTag = useCallback(
    async (id, tag) => {
      if (!requireAuth()) return;

      const link = links.find((item) => item._id === id);

      if (!link) return;

      const optimistic = {
        ...link,
        tags: (link.tags || []).filter((item) => item !== tag),
      };

      setLinks((current) =>
        current.map((item) => (item._id === id ? optimistic : item)),
      );

      setDetailLink((current) => (current?._id === id ? optimistic : current));

      try {
        const serverLink = await removeTagOnServer(id, tag, token, apiUrl);

        const finalLink = normalizeLink(serverLink || optimistic);

        await dbPut(finalLink);

        setLinks((current) =>
          current.map((item) => (item._id === id ? finalLink : item)),
        );

        setDetailLink((current) => (current?._id === id ? finalLink : current));
      } catch (error) {
        console.error("Remove tag error:", error);
        showToast("Could not remove tag.", "error");
      }
    },
    [links, requireAuth, token, apiUrl, showToast],
  );

  // ========================================================================
  // Filter and sort
  // ========================================================================

  const filteredLinks = useMemo(() => {
    return filterAndSortLinks(links, {
      search,
      category,
      sort,
      onlyStarred,
    });
  }, [links, search, category, sort, onlyStarred]);

  // ========================================================================
  // Loading state
  // ========================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-indigo-400"
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
          </div>

          <p className="text-sm font-medium text-slate-400">
            {syncing ? "Syncing your links..." : "Loading your links…"}
          </p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // Main UI
  // ========================================================================

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Overlays and modals */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {showLoginRequired && (
        <LoginRequiredModal
          onClose={() => setShowLoginRequired(false)}
          onLogin={onLogin}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete link?"
          message="This will permanently remove the link. This cannot be undone."
          onConfirm={confirmDeleteLink}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmClear && (
        <ConfirmDialog
          title="Clear all local links?"
          message="All cached links will be removed from this browser. This cannot be undone."
          onConfirm={clearAll}
          onCancel={() => setConfirmClear(false)}
        />
      )}

      {detailLink && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            onClick={() => setDetailLink(null)}
          />

          <DetailsSidebar
            link={detailLink}
            onClose={() => setDetailLink(null)}
            onDelete={(id) => {
              setDetailLink(null);
              handleDelete(id);
            }}
            onRename={(id, title) => updateLink(id, { title })}
            onToggleStar={toggleStar}
            onUpdateNote={(id, note) =>
              updateLink(id, {
                note: String(note || "").trim(),
              })
            }
            onUpdateCategory={(id, value) =>
              updateLink(id, {
                category: value,
              })
            }
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onVisit={handleVisit}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
            categories={CATEGORIES}
          />
        </>
      )}

      {showAdd && isAuthenticated && (
        <AddLinkModal
          onClose={() => setShowAdd(false)}
          onSave={handleSave}
          categories={CATEGORIES}
        />
      )}

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Header
          isAuthenticated={isAuthenticated}
          linkCount={links.length}
          onClearAll={() => {
            if (!requireAuth()) return;
            setConfirmClear(true);
          }}
          onAddNew={() => {
            if (!requireAuth()) return;
            setShowAdd(true);
          }}
          requireAuth={requireAuth}
        />

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          onlyStarred={onlyStarred}
          onToggleStarred={setOnlyStarred}
          layout={layout}
          onLayoutChange={setLayout}
          sortOptions={SORT_OPTIONS}
        />

        <CategoryTabs
          active={category}
          onChange={setCategory}
          categories={CATEGORIES}
        />

        <LinkCountBar
          filtered={filteredLinks.length}
          total={links.length}
          saving={saving}
          syncing={syncing}
        />

        {/* Links grid/list */}
        {filteredLinks.length === 0 ? (
          <EmptyState
            query={search}
            onAdd={() => {
              if (!requireAuth()) return;
              setShowAdd(true);
            }}
            isAuthenticated={isAuthenticated}
            requireAuth={requireAuth}
          />
        ) : layout === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLinks.map((link) => (
              <LinkCardGrid
                key={link._id}
                link={link}
                onVisit={handleVisit}
                onOpenDetails={setDetailLink}
                onDelete={handleDelete}
                onToggleStar={toggleStar}
                isAuthenticated={isAuthenticated}
                requireAuth={requireAuth}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredLinks.map((link) => (
              <LinkCardList
                key={link._id}
                link={link}
                onVisit={handleVisit}
                onOpenDetails={setDetailLink}
                onDelete={handleDelete}
                onToggleStar={toggleStar}
                isAuthenticated={isAuthenticated}
                requireAuth={requireAuth}
              />
            ))}
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}
