import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Eye,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage, auth } from "../../firebase";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────── */

export interface MediaFileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  /** Permanent Firebase Storage download URL (not base64) */
  dataUrl: string;
  /** Firebase Storage path so we can delete the file later */
  storagePath?: string;
  uploadedAt: number;
  category: "image" | "document" | "other";
  progress?: number;
  status?: "uploading" | "success" | "error";
}

export interface ResourceLinkItem {
  id: string;
  title: string;
  url: string;
  addedAt: number;
  favicon?: string;
}

/* ─── Utility helpers ───────────────────────────────────────────── */

function getFaviconUrl(pageUrl: string): string {
  try {
    const u = new URL(pageUrl.startsWith("http") ? pageUrl : `https://${pageUrl}`);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return "";
  }
}

function getDomain(pageUrl: string): string {
  try {
    return new URL(pageUrl.startsWith("http") ? pageUrl : `https://${pageUrl}`)
      .hostname.replace(/^www\./, "");
  } catch {
    return pageUrl;
  }
}

/** Metadata-only key — we never store base64 here, just the small JSON */
const LS_FILES_KEY = "skillsphere_media_meta_v2";
const LS_LINKS_KEY = "skillsphere_saved_links";

function loadFromLS<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    }
  } catch {}
  return [];
}

function saveToLS<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

/* ─── Pending upload tracker ────────────────────────────────────── */

interface PendingUpload {
  id: string;
  name: string;
  size: number;
  progress: number;
  error?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   Component
══════════════════════════════════════════════════════════════════ */

export const DashboardMedia: React.FC = () => {
  /* ── Persisted state ─────────────────────────────────────────── */
  const [files, setFiles] = useState<MediaFileItem[]>(() => loadFromLS<MediaFileItem>(LS_FILES_KEY));
  const [links, setLinks] = useState<ResourceLinkItem[]>(() => loadFromLS<ResourceLinkItem>(LS_LINKS_KEY));

  /* ── Upload state ────────────────────────────────────────────── */
  const [pending, setPending] = useState<PendingUpload[]>([]);

  /* ── UI state ────────────────────────────────────────────────── */
  const [lightboxImage, setLightboxImage] = useState<MediaFileItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  /* ── Persist files metadata whenever it changes ─────────────── */
  useEffect(() => {
    // Strip any pending/error items before persisting
    const toSave = files.filter((f) => f.status === "success");
    saveToLS(LS_FILES_KEY, toSave);
  }, [files]);

  useEffect(() => {
    saveToLS(LS_LINKS_KEY, links);
  }, [links]);

  /* ── File upload ─────────────────────────────────────────────── */
  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const uid = auth.currentUser?.uid ?? "anonymous";

    Array.from(fileList).forEach((file) => {
      const itemId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const category: MediaFileItem["category"] = file.type.startsWith("image/")
        ? "image"
        : "document";

      // Add a pending tracker
      setPending((prev) => [
        { id: itemId, name: file.name, size: file.size, progress: 0 },
        ...prev,
      ]);

      // Build a unique path under the user's folder
      const path = `media/${uid}/${itemId}_${file.name}`;
      const ref = storageRef(storage, path);
      const task = uploadBytesResumable(ref, file);

      task.on(
        "state_changed",
        (snap) => {
          const pct = snap.totalBytes > 0
            ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            : 0;
          setPending((prev) =>
            prev.map((p) => (p.id === itemId ? { ...p, progress: pct } : p))
          );
        },
        (err) => {
          console.error("Upload failed:", err);
          setPending((prev) =>
            prev.map((p) =>
              p.id === itemId ? { ...p, error: "Upload failed. Check storage rules." } : p
            )
          );
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            const item: MediaFileItem = {
              id: itemId,
              name: file.name,
              type: file.type || "application/octet-stream",
              size: file.size,
              dataUrl: downloadUrl,
              storagePath: path,
              uploadedAt: Date.now(),
              category,
              progress: 100,
              status: "success",
            };
            setFiles((prev) => [item, ...prev]);
            setPending((prev) => prev.filter((p) => p.id !== itemId));
          } catch (e) {
            console.error("getDownloadURL failed:", e);
            setPending((prev) =>
              prev.map((p) =>
                p.id === itemId ? { ...p, error: "Could not retrieve file URL." } : p
              )
            );
          }
        }
      );
    });
  };

  const handleDeleteFile = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target) return;

    // Remove from UI immediately
    setFiles((prev) => prev.filter((f) => f.id !== id));

    // Best-effort delete from Storage
    if (target.storagePath) {
      try {
        await deleteObject(storageRef(storage, target.storagePath));
      } catch {
        // If the file is already gone or permission denied, ignore
      }
    }
  };

  /* ── Link helpers ────────────────────────────────────────────── */
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newName.trim();
    let url = newUrl.trim();
    if (!title || !url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;

    setIsSavingLink(true);
    const item: ResourceLinkItem = {
      id: `link-${Date.now()}`,
      title,
      url,
      favicon: getFaviconUrl(url),
      addedAt: Date.now(),
    };
    setLinks((prev) => [item, ...prev]);
    setNewName("");
    setNewUrl("");
    setIsSavingLink(false);
    setJustSaved(true);
    setTimeout(() => { setJustSaved(false); setShowLinkForm(false); }, 900);
  };

  const handleDeleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  /* ── Misc ────────────────────────────────────────────────────── */
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const imageFiles = files.filter(
    (f) => f.status === "success" && (f.category === "image" || f.type.startsWith("image/"))
  );

  /* ═══════════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 max-w-7xl mx-auto text-foreground">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-foreground m-0">
          Media &amp; resources
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowLinkForm((v) => !v); setJustSaved(false); }}
            className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 text-foreground text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Add link</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer border-none shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload notes</span>
          </button>
        </div>
      </div>

      {/* ── Dropzone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 group bg-card",
          isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={(e) => { processFiles(e.target.files); e.target.value = ""; }}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-105 transition-transform text-primary">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-[14px] font-semibold text-foreground m-0">Drop files to upload</h3>
          <p className="text-[12px] text-muted-foreground">
            JPG, PNG diagrams, system architecture charts, or PDF documentation (up to 10&nbsp;MB)
          </p>
        </div>
      </div>

      {/* ── Active upload progress cards ── */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border text-[12px]",
                p.error
                  ? "bg-destructive/5 border-destructive/30 text-destructive"
                  : "bg-card border-border"
              )}
            >
              {p.error ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium truncate max-w-[200px]">{p.name}</span>
                  <span className="tabular-nums text-muted-foreground ml-2 shrink-0">
                    {p.error ? "Failed" : `${p.progress}%`}
                  </span>
                </div>
                {!p.error && (
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                )}
                {p.error && <p className="text-[11px] mt-0.5 opacity-80">{p.error}</p>}
              </div>
              {p.error && (
                <button
                  onClick={() => setPending((prev) => prev.filter((x) => x.id !== p.id))}
                  className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add Link form ── */}
      {showLinkForm && (
        <form
          onSubmit={handleAddLink}
          className="p-4 rounded-2xl bg-card border border-border space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-[14px] font-semibold text-foreground">Save a link</h3>
            <button
              type="button"
              onClick={() => setShowLinkForm(false)}
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              placeholder="Name  (e.g. NeetCode 150)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              required
              placeholder="URL  (e.g. https://neetcode.io)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <button
              type="submit"
              disabled={isSavingLink || justSaved}
              className={cn(
                "px-5 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider border-none cursor-pointer transition-all flex items-center gap-1.5 shrink-0",
                justSaved
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isSavingLink ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : justSaved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{justSaved ? "Saved!" : "Save"}</span>
            </button>
          </div>

          {/* Live preview pill */}
          {newUrl.trim() && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-muted-foreground">Preview:</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border text-[12px] font-medium text-foreground">
                <img
                  src={getFaviconUrl(newUrl)}
                  alt=""
                  className="w-3.5 h-3.5 rounded-sm object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <span className="max-w-[200px] truncate">{newName.trim() || getDomain(newUrl)}</span>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ── Saved links tag strip ── */}
      {links.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-primary" />
            <h3 className="text-[14px] font-semibold text-foreground">
              Saved links <span className="text-muted-foreground font-normal">({links.length})</span>
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="group/tag inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-secondary border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all text-[12px] font-medium text-foreground cursor-default"
              >
                {link.favicon ? (
                  <img
                    src={link.favicon}
                    alt=""
                    className="w-4 h-4 rounded-sm object-contain shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-4 h-4 rounded-sm bg-primary/15 flex items-center justify-center shrink-0">
                    <LinkIcon className="w-2.5 h-2.5 text-primary" />
                  </div>
                )}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-[180px] truncate text-foreground hover:text-primary transition-colors no-underline leading-none"
                  title={link.url}
                >
                  {link.title}
                </a>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover/tag:opacity-100"
                  title="Open"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="p-0.5 rounded-full text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-none bg-transparent opacity-0 group-hover/tag:opacity-100"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Image gallery ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            Uploaded JPG Diagrams &amp; Notes ({imageFiles.length})
          </h3>
          <span className="text-[12px] text-muted-foreground">Click any image to expand full-screen</span>
        </div>

        {imageFiles.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-card border border-border text-muted-foreground text-[12px]">
            No files uploaded yet. Drop JPGs or diagrams above to organize your study notes!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {imageFiles.map((file) => (
              <div
                key={file.id}
                className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all group flex flex-col justify-between shadow-xs"
              >
                <div
                  onClick={() => setLightboxImage(file)}
                  className="relative w-full aspect-video sm:aspect-4/3 bg-secondary/30 cursor-pointer overflow-hidden"
                >
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white">
                    <Eye className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">Preview</span>
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] font-mono uppercase text-white font-bold">
                    {file.name.split(".").pop() || "JPG"}
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-foreground truncate max-w-[160px]" title={file.name}>
                      {file.name}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {formatSize(file.size)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
                    <a
                      href={file.dataUrl}
                      download={file.name}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border-none bg-transparent"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-card rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/40">
              <span className="text-[12px] font-semibold text-foreground truncate max-w-md">
                {lightboxImage.name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 no-underline"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 sm:p-4 max-h-[75vh] overflow-auto flex items-center justify-center">
              <img
                src={lightboxImage.dataUrl}
                alt={lightboxImage.name}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardMedia;
