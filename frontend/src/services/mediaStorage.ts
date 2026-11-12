/**
 * Permanent local media storage using HTML5 IndexedDB.
 * Bypasses localStorage 5MB quota restrictions and persists files
 * across page reloads, browser restarts, and offline sessions
 * without CORS errors.
 */

export interface PersistedMediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
  category: "image" | "document" | "other";
  dataUrl: string;
  blob?: Blob;
  storagePath?: string;
  cloudUrl?: string;
  status: "success" | "uploading" | "error";
}

const DB_NAME = "SkillSphereMediaDB";
const STORE_NAME = "user_media_files";
const DB_VERSION = 1;

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

/**
 * Saves a media item (with its raw binary Blob) permanently into IndexedDB.
 */
export async function saveMediaToIndexedDB(item: {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: number;
  category: "image" | "document" | "other";
  blob: Blob;
  storagePath?: string;
  cloudUrl?: string;
}): Promise<void> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({
        id: item.id,
        name: item.name,
        type: item.type,
        size: item.size,
        uploadedAt: item.uploadedAt,
        category: item.category,
        blob: item.blob,
        storagePath: item.storagePath,
        cloudUrl: item.cloudUrl,
      });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Could not save file to IndexedDB:", err);
  }
}

/**
 * Updates an existing media record (e.g. after cloud upload completes).
 */
export async function updateMediaInIndexedDB(
  id: string,
  updates: Partial<{ storagePath: string; cloudUrl: string }>
): Promise<void> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result;
        if (!record) {
          resolve();
          return;
        }
        const updated = { ...record, ...updates };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn("Could not update IndexedDB record:", err);
  }
}

/**
 * Loads all media items from IndexedDB and creates object URLs for image preview.
 */
export async function loadAllMediaFromIndexedDB(): Promise<PersistedMediaFile[]> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const rawItems = req.result || [];
        const result: PersistedMediaFile[] = rawItems.map((entry: any) => {
          let previewUrl = entry.cloudUrl || "";
          if (entry.blob) {
            try {
              previewUrl = URL.createObjectURL(entry.blob);
            } catch {
              previewUrl = entry.cloudUrl || "";
            }
          }

          return {
            id: entry.id,
            name: entry.name,
            type: entry.type,
            size: entry.size,
            uploadedAt: entry.uploadedAt,
            category: entry.category,
            dataUrl: previewUrl,
            blob: entry.blob,
            storagePath: entry.storagePath,
            cloudUrl: entry.cloudUrl,
            status: "success",
          };
        });

        // Newest uploads first
        result.sort((a, b) => b.uploadedAt - a.uploadedAt);
        resolve(result);
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Could not load media from IndexedDB:", err);
    return [];
  }
}

/**
 * Deletes a file record from IndexedDB.
 */
export async function deleteMediaFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Could not delete from IndexedDB:", err);
  }
}

