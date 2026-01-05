import { sampleFoundItems, FoundItem } from "./sampleFoundItems";

const FOUND_KEY = "foundItems";

// Load persisted found items from localStorage (if any), otherwise use sample data.
let items: FoundItem[] = [];
try {
  const raw = localStorage.getItem(FOUND_KEY);
  items = raw ? (JSON.parse(raw) as FoundItem[]) : [...sampleFoundItems];
} catch (e) {
  items = [...sampleFoundItems];
}

export function getFoundItems() {
  return items;
}

// Background: compute missing embeddings for existing items (best-effort, non-blocking)
(async function ensureEmbeddings() {
  try {
    const { getImageEmbeddingFromDataUrl } = await import("./embeddings");
    let changed = false;
    for (const it of items) {
      if (it.imageUrl && !it.embedding && it.imageUrl.startsWith("data:")) {
        try {
          it.embedding = await getImageEmbeddingFromDataUrl(it.imageUrl);
          changed = true;
        } catch (e) {
          console.warn("Failed to compute embedding for stored item", it.id, e);
        }
      }
    }
    // Persist any newly computed embeddings
    if (changed) {
      try {
        localStorage.setItem(FOUND_KEY, JSON.stringify(items));
      } catch (e) {
        // ignore persist failures
      }
    }
  } catch (e) {
    // ignore if embeddings module isn't available in this environment
  }
})();

// Lost items (reported by users searching for their lost property)
export type LostItem = {
  id: string;
  title: string;
  imageUrl?: string;
  description?: string;
  location?: string;
  timestamp?: string;
};

const LOST_KEY = "lostItems";
let lostItems: LostItem[] = [];
try {
  const raw = localStorage.getItem(LOST_KEY);
  lostItems = raw ? (JSON.parse(raw) as LostItem[]) : [];
} catch (e) {
  lostItems = [];
}

export function getLostItems() {
  return lostItems;
}

export async function addLostItem(item: LostItem) {
  lostItems.unshift(item);
  try {
    localStorage.setItem(LOST_KEY, JSON.stringify(lostItems));
  } catch (e) {
    console.warn("Failed to persist lost items", e);
  }
}

export function removeLostItem(id: string) {
  const idx = lostItems.findIndex((i) => i.id === id);
  if (idx > -1) {
    lostItems.splice(idx, 1);
    try {
      localStorage.setItem(LOST_KEY, JSON.stringify(lostItems));
    } catch (e) {
      console.warn("Failed to persist lost items", e);
    }
    return true;
  }
  return false;
}

export type PendingSearch = {
  id: string;
  image?: string | null;
  description?: string;
  timestamp: string;
  notified?: boolean;
};

const PENDING_KEY = "pendingSearches";

export function getPendingSearches(): PendingSearch[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingSearch[]) : [];
  } catch (e) {
    console.warn("Failed to read pending searches", e);
    return [];
  }
}

export function addPendingSearch(p: PendingSearch) {
  const arr = getPendingSearches();
  arr.unshift(p);
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("Failed to save pending search", e);
  }
}

export function markPendingNotified(id: string) {
  const arr = getPendingSearches();
  const idx = arr.findIndex((a) => a.id === id);
  if (idx > -1) {
    arr[idx].notified = true;
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn("Failed to mark pending notified", e);
    }
  }
}

export function removePendingSearch(id: string) {
  const arr = getPendingSearches().filter((a) => a.id !== id);
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("Failed to remove pending search", e);
  }
}

export async function addFoundItem(item: FoundItem) {
  // If we have an image, try to compute an embedding (best-effort)
  if (item.imageUrl && !item.embedding) {
    try {
      const { getImageEmbeddingFromDataUrl } = await import("./embeddings");
      // If imageUrl is a remote URL, fetch and convert to dataURL
      let dataUrl = item.imageUrl;
      if (!dataUrl.startsWith("data:")) {
        try {
          const res = await fetch(item.imageUrl);
          const blob = await res.blob();
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          // If fetching remote images fails, continue — we still store the item for later manual checks
          console.warn("Failed to fetch remote image for embedding, leaving as URL", e);
        }
      }
      if (dataUrl && dataUrl.startsWith("data:")) {
        item.embedding = await getImageEmbeddingFromDataUrl(dataUrl);
        // Persist embedding immediately so subsequent matches can use it
        try {
          localStorage.setItem(FOUND_KEY, JSON.stringify(items));
        } catch (e) {
          console.warn("Failed to persist found items after embedding", e);
        }
      }
    } catch (err) {
      // ignore embedding failures for prototype
      console.warn("Embedding failed:", err);
    }
  }

  items.unshift(item);
  // Persist the updated list so matches work without a backend
  try {
    localStorage.setItem(FOUND_KEY, JSON.stringify(items));
    // Development log for debugging: show that item was saved and whether it has embedding
    // eslint-disable-next-line no-console
    console.info("Found item saved locally:", item.id, { hasEmbedding: !!item.embedding, deskLocation: item.deskLocation || null, savedBy: (item as any).savedBy || null });
  } catch (e) {
    console.warn("Failed to persist found items", e);
  }

  // Best-effort: check pending searches and mark as notified if the newly added item appears to match.
  try {
    const pending = getPendingSearches();
    if (pending.length > 0) {
      const { findMatchesAsync } = await import("./matcher");
      for (const p of pending) {
        if (p.notified) continue;
        const matches = await findMatchesAsync({ labels: [], webEntities: [], raw: {} }, p.description || "", [item]);
        if (matches && matches.length > 0 && matches[0].score > 0.15) {
          // Mark pending as notified so we don't notify again
          markPendingNotified(p.id);
          // Development-time log — in a real app we'd send a push/email/etc.
          // eslint-disable-next-line no-console
          console.info("Pending search matched new item:", p.id, item.id, matches[0].score, "reason:", matches[0].reason);
        }
      }
    }
  } catch (e) {
    console.warn("Pending check failed", e);
  }

  return item;
}

export function removeFoundItem(idOrKey: string) {
  // Try several heuristics to find a matching item: id exact, imageUrl exact, title exact (case-insensitive), or id suffix.
  let idx = items.findIndex((i) => i.id === idOrKey);
  if (idx === -1) idx = items.findIndex((i) => i.imageUrl === idOrKey);
  if (idx === -1) idx = items.findIndex((i) => (i.title || "").toLowerCase() === (idOrKey || "").toLowerCase());
  if (idx === -1 && idOrKey) idx = items.findIndex((i) => i.id && i.id.endsWith(idOrKey));

  if (idx > -1) {
    const removed = items.splice(idx, 1)[0];
    try {
      localStorage.setItem(FOUND_KEY, JSON.stringify(items));
      // eslint-disable-next-line no-console
      console.info("removeFoundItem: removed", removed.id);
    } catch (e) {
      console.warn("Failed to persist found items after removal", e);
    }
    return true;
  }

  // Not found — log helpful debug info for developers (include stack to identify caller)
  // eslint-disable-next-line no-console
  console.warn("removeFoundItem: item not found for", idOrKey, "available ids:", items.map((i) => i.id), "stack:", new Error().stack);
  return false; 
}

// Update a found item in-place and persist. Returns the updated item or null if not found.
export async function updateFoundItem(id: string, patch: Partial<FoundItem>) {
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch };
  try {
    localStorage.setItem(FOUND_KEY, JSON.stringify(items));
    // eslint-disable-next-line no-console
    console.info("Found item updated:", id, patch);
  } catch (e) {
    console.warn("Failed to persist found items after update", e);
  }
  return items[idx];
}
