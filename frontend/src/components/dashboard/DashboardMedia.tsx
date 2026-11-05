import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Eye,
  X,
  RotateCcw,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaFileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: number;
  category: "image" | "document" | "other";
  progress?: number;
  status?: "uploading" | "success" | "error";
}

export interface ResourceLinkItem {
  id: string;
  title: string;
  url: string;
  type: "video" | "article" | "course" | "other";
  addedAt: number;
}

const DEFAULT_FILES: MediaFileItem[] = [
  {
    id: "sample-jpg-1",
    name: "algorithms_cheatsheet.jpg",
    type: "image/jpeg",
    size: 420 * 1024,
    dataUrl: "https://images.unsplash.com/photo-1516116211227-bbc0643b1c67?w=800&auto=format&fit=crop&q=60",
    uploadedAt: Date.now() - 86400000 * 1,
    category: "image",
    progress: 100,
    status: "success",
  },
  {
    id: "sample-jpg-2",
    name: "system_architecture_diagram.jpg",
    type: "image/jpeg",
    size: 890 * 1024,
    dataUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
    uploadedAt: Date.now() - 86400000 * 3,
    category: "image",
    progress: 100,
    status: "success",
  },
  {
    id: "sample-jpg-3",
    name: "coding_desk_notes.jpg",
    type: "image/jpeg",
    size: 1.2 * 1024 * 1024,
    dataUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
    uploadedAt: Date.now() - 86400000 * 6,
    category: "image",
    progress: 100,
    status: "success",
  },
];

const DEFAULT_LINKS: ResourceLinkItem[] = [
  {
    id: "link-1",
    title: "NeetCode 150 - Algorithm Roadmap",
    url: "https://neetcode.io/roadmap",
    type: "course",
    addedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "link-2",
    title: "System Design Primer by Donne Martin",
    url: "https://github.com/donnemartin/system-design-primer",
    type: "article",
    addedAt: Date.now() - 86400000 * 8,
  },
];

export const DashboardMedia: React.FC = () => {
  const [files, setFiles] = useState<MediaFileItem[]>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_uploaded_media");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [links, setLinks] = useState<ResourceLinkItem[]>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_saved_links");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [lightboxImage, setLightboxImage] = useState<MediaFileItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link Modal
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "", type: "article" as ResourceLinkItem["type"] });

  const saveFiles = (updated: MediaFileItem[]) => {
    setFiles(updated);
    try {
      localStorage.setItem("skillsphere_uploaded_media", JSON.stringify(updated));
    } catch {}
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const category: MediaFileItem["category"] = file.type.startsWith("image/") ? "image" : "document";

        const item: MediaFileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
          uploadedAt: Date.now(),
          category,
          progress: 100,
          status: "success",
        };

        setFiles((prev) => {
          const next = [item, ...prev];
          try {
            localStorage.setItem("skillsphere_uploaded_media", JSON.stringify(next));
          } catch {}
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteFile = (id: string) => {
    saveFiles(files.filter((f) => f.id !== id));
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.title.trim() || !newLink.url.trim()) return;
    let url = newLink.url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;

    const item: ResourceLinkItem = {
      id: `link-${Date.now()}`,
      title: newLink.title.trim(),
      url,
      type: newLink.type,
      addedAt: Date.now(),
    };

    const next = [item, ...links];
    setLinks(next);
    setNewLink({ title: "", url: "", type: "article" });
    setShowLinkForm(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const imageFiles = files.filter((f) => f.category === "image" || f.type.startsWith("image/"));

  return (
    <div className="space-y-5 max-w-7xl mx-auto text-foreground">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-foreground m-0">Media & resources</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="px-3 py-1.5 rounded-md bg-surface-muted hover:bg-surface-muted/80 text-foreground text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
          >
            <Plus className="w-3.5 h-3.5" />
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

      {/* Upload Dropzone Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          processFiles(e.dataTransfer.files);
        }}
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
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center group-hover:scale-105 transition-transform text-primary">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-[14px] font-semibold text-foreground m-0">Drop files to upload</h3>
          <p className="text-[12px] text-muted-foreground">
            JPG, PNG diagrams, system architecture charts, or PDF documentation (up to 10MB)
          </p>
        </div>
      </div>

      {/* Add Link Form */}
      {showLinkForm && (
        <form
          onSubmit={handleAddLink}
          className="p-4 rounded-2xl bg-card border border-border space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-[14px] font-semibold text-foreground">Add Resource Link</h3>
            <button
              type="button"
              onClick={() => setShowLinkForm(false)}
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              placeholder="Title (e.g. NeetCode 150)"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              className="px-3 py-1.5 rounded-xl bg-background border border-border text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              required
              placeholder="https://..."
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="px-3 py-1.5 rounded-xl bg-background border border-border text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer border-none"
            >
              Save Link
            </button>
          </div>
        </form>
      )}

      {/* ─── JPGs & Files Gallery ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            Uploaded JPG Diagrams & Notes ({imageFiles.length})
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
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{formatSize(file.size)}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
                    <a
                      href={file.dataUrl}
                      download={file.name}
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

      {/* ─── Learning Links Grid ─── */}
      {links.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-[14px] font-semibold text-foreground">Saved Study & Architecture Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors flex items-center justify-between no-underline group"
              >
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
                    {link.type}
                  </span>
                  <h4 className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate mt-0.5">
                    {link.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">{link.url}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteLink(link.id);
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Full-screen Lightbox Modal */}
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
              <span className="text-[12px] font-semibold text-foreground truncate max-w-md">{lightboxImage.name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.dataUrl}
                  download={lightboxImage.name}
                  className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
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
              <img src={lightboxImage.dataUrl} alt={lightboxImage.name} className="max-h-[70vh] w-auto rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardMedia;
