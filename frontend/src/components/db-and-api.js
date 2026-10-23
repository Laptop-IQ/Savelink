import { normalizeLink } from "./utils";

// ============================================================================
// INDEXEDDB
// ============================================================================

const DB_NAME = "linkvault_db";
const DB_VERSION = 2;
const STORE_NAME = "links";

let dbPromise = null;

export function openDB() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }

      db.createObjectStore(STORE_NAME, {
        keyPath: "_id",
      });
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn("IndexedDB upgrade blocked");
    };
  });

  return dbPromise;
}

export async function dbGetAll() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPut(link) {
  const normalized = normalizeLink(link);

  if (!normalized) {
    throw new Error("Invalid link");
  }

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");

    tx.objectStore(STORE_NAME).put(normalized);

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

export async function dbPutMany(links) {
  if (!links.length) return;

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const link of links) {
      const normalized = normalizeLink(link);

      if (normalized) {
        store.put(normalized);
      }
    }

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

export async function dbDelete(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");

    tx.objectStore(STORE_NAME).delete(id);

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

// Replace the whole cache in ONE transaction (faster + atomic vs clear() then put()).
export async function dbReplaceAll(links) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.clear();

    for (const link of links) {
      const normalized = normalizeLink(link);

      if (normalized) {
        store.put(normalized);
      }
    }

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

export async function dbClear() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");

    tx.objectStore(STORE_NAME).clear();

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

// ----------------------------------------------------------------------------
// Cache ownership: the IndexedDB cache belongs to ONE user. This stops another
// account (or a logged-out visitor) from ever seeing someone else's cached links.
// ----------------------------------------------------------------------------

const CACHE_OWNER_KEY = "linkvault_cache_owner";

export function getCacheOwner() {
  try {
    return localStorage.getItem(CACHE_OWNER_KEY);
  } catch {
    return null;
  }
}

export function setCacheOwner(owner) {
  try {
    if (owner) localStorage.setItem(CACHE_OWNER_KEY, owner);
    else localStorage.removeItem(CACHE_OWNER_KEY);
  } catch {
    /* storage unavailable */
  }
}

// ============================================================================
// API REQUESTS
// ============================================================================

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    console.error("API error:", {
      url,
      status: response.status,
      response: result,
    });

    throw new Error(
      typeof result === "string"
        ? `Server error: ${response.status} - ${result}`
        : `Server error: ${response.status} - ${result?.error || result?.message || JSON.stringify(result)}`,
    );
  }

  return result;
}

export async function fetchLinksFromServer(token, apiUrl, signal) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Server default page size is 20; ask for the max (100) so users with more
    // than 20 links see all of them.
    const data = await apiRequest(`${apiUrl}/links?limit=100`, {
      headers,
      signal,
    });

    return Array.isArray(data.links) ? data.links : [];
  } catch (error) {
    console.error("Failed to fetch links:", error);
    return null;
  }
}

export async function saveToServer(data, token, apiUrl) {
  try {
    const response = await apiRequest(`${apiUrl}/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    return response.link || null;
  } catch (error) {
    console.error("Failed to save link:", error);
    return null;
  }
}

export async function updateOnServer(id, changes, token, apiUrl) {
  const response = await apiRequest(`${apiUrl}/links/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(changes),
  });

  return response.link || null;
}

export async function deleteFromServer(id, token, apiUrl) {
  await apiRequest(`${apiUrl}/links/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return true;
}

export async function toggleStarOnServer(id, token, apiUrl) {
  const response = await apiRequest(`${apiUrl}/links/${id}/star`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.link || null;
}

export async function recordVisitOnServer(id, token, apiUrl) {
  await apiRequest(`${apiUrl}/links/${id}/visit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return true;
}

export async function addTagOnServer(id, tag, token, apiUrl) {
  const response = await apiRequest(`${apiUrl}/links/${id}/tag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tag }),
  });

  return response.link || null;
}

export async function removeTagOnServer(id, tag, token, apiUrl) {
  const response = await apiRequest(`${apiUrl}/links/${id}/tag`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tag }),
  });

  return response.link || null;
}
