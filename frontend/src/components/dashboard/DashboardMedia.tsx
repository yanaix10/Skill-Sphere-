import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  FileText,
  Film,
  BookOpen,
  Headphones,
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export interface UploadedFileItem {
  id: string;
  name: string;
  type: string; // e.g. "image/jpeg", "image/png", "application/pdf"
  size: number;
  dataUrl: string;
  uploadedAt: number;
  category: "image" | "document" | "other";
}

export interface ResourceLinkItem {
  id: string;
  title: string;
  url: string;
  type: "video" | "article" | "course" | "podcast" | "other";
  addedAt: number;
}

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
    title: "Dynamic Programming Patterns & Examples",
    url: "https://leetcode.com/discuss/general-discussion/458695/Dynamic-Programming-Patterns",
    type: "article",
    addedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "link-3",
    title: "System Design Primer by Donne Martin",
    url: "https://github.com/donnemartin/system-design-primer",
    type: "course",
    addedAt: Date.now() - 86400000 * 8,
  },
];

export const DashboardMedia: React.FC = () => {
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [links, setLinks] = useState<ResourceLinkItem[]>(DEFAULT_LINKS);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "images" | "documents" | "links">("all");
  const [lightboxImage, setLightboxImage] = useState<UploadedFileItem | null>(null);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link form state
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "", type: "article" as ResourceLinkItem["type"] });

  const uid = auth.currentUser?.uid;

  /* ─── Load Files and Links ─── */
  useEffect(() => {
    try {
      const storedFiles = localStorage.getItem("skillsphere_uploaded_media");
      if (storedFiles) {
        setFiles(JSON.parse(storedFiles));
      } else {
        // Sample sample JPG placeholders if empty
        const sampleFiles: UploadedFileItem[] = [
          {
            id: "sample-jpg-1",
            name: "algorithms_cheatsheet.jpg",
            type: "image/jpeg",
            size: 420 * 1024,
            dataUrl: "https://images.unsplash.com/photo-1516116211227-bbc0643b1c67?w=800&auto=format&fit=crop&q=60",
            uploadedAt: Date.now() - 86400000 * 1,
            category: "image",
          },
          {
            id: "sample-jpg-2",
            name: "system_architecture_diagram.jpg",
            type: "image/jpeg",
            size: 890 * 1024,
            dataUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
            uploadedAt: Date.now() - 86400000 * 3,
            category: "image",
          },
          {
            id: "sample-jpg-3",
            name: "coding_desk_notes.jpg",
            type: "image/jpeg",
            size: 1.2 * 1024 * 1024,
            dataUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
            uploadedAt: Date.now() - 86400000 * 6,
            category: "image",
          },
        ];
        setFiles(sampleFiles);
        localStorage.setItem("skillsphere_uploaded_media", JSON.stringify(sampleFiles));
      }

      const storedLinks = localStorage.getItem("skillsphere_resource_links");
      if (storedLinks) {
        setLinks(JSON.parse(storedLinks));
      }
    } catch (e) {
      console.warn("Could not load media from storage", e);
    }
  }, []);

  const saveFiles = (updated: UploadedFileItem[]) => {
    setFiles(updated);
    try {
      localStorage.setItem("skillsphere_uploaded_media", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage quota exceeded or error saving:", e);
    }
  };

  const saveLinks = (updated: ResourceLinkItem[]) => {
    setLinks(updated);
    try {
      localStorage.setItem("skillsphere_resource_links", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage error saving links:", e);
    }
  };

  /* ─── Handle File Upload ─── */
  const processUploadedFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploadError(null);

    Array.from(selectedFiles).forEach((file) => {
      // Max 10MB limit per local file
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" is over 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const category: UploadedFileItem["category"] = file.type.startsWith("image/")
          ? "image"
          : file.type.includes("pdf") || file.name.endsWith(".pdf") || file.name.endsWith(".doc") || file.name.endsWith(".txt")
          ? "document"
          : "other";

        const newItem: UploadedFileItem = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          dataUrl,
          uploadedAt: Date.now(),
          category,
        };

        setFiles((prev) => {
          const next = [newItem, ...prev];
          try {
            localStorage.setItem("skillsphere_uploaded_media", JSON.stringify(next));
          } catch (e) {
            console.warn("LocalStorage full, retaining in memory:", e);
          }
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    saveFiles(updated);
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    let formattedUrl = newLink.url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const item: ResourceLinkItem = {
      id: `link-${Date.now()}`,
      title: newLink.title.trim(),
      url: formattedUrl,
      type: newLink.type,
      addedAt: Date.now(),
    };

    saveLinks([item, ...links]);
    setNewLink({ title: "", url: "", type: "article" });
    setShowLinkForm(false);
  };

  const handleDeleteLink = (id: string) => {
    const updated = links.filter((l) => l.id !== id);
    saveLinks(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredFiles = files.filter((f) => {
    if (selectedFilter === "images") return f.category === "image";
    if (selectedFilter === "documents") return f.category === "document";
    return true;
  });

  const imageFilesCount = files.filter((f) => f.category === "image").length;
  const docFilesCount = files.filter((f) => f.category === "document").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <ImageIcon className="w-6 h-6 text-primary" />
            Media & Study Resources
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Store and preview study material, solution diagrams (JPG/PNG), architecture charts, and reference courses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Resource Link</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer border-none"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          processUploadedFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border bg-card hover:bg-secondary/30 hover:border-primary/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.txt"
          onChange={(e) => processUploadedFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              Click to upload JPG / PNG images & files, or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports JPG, PNG, WebP, PDF & documentation (up to 10MB per file)
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Add Link Form Modal / Dropdown */}
      {showLinkForm && (
        <form
          onSubmit={handleAddLink}
          className="p-4 rounded-2xl bg-card border border-border space-y-3 animate-in fade-in duration-150 shadow-sm"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Add Resource Link</span>
            <button
              type="button"
              onClick={() => setShowLinkForm(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Title (e.g. NeetCode 150)"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
            <input
              type="text"
              placeholder="URL (https://...)"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
            <select
              value={newLink.type}
              onChange={(e) => setNewLink({ ...newLink, type: e.target.value as any })}
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="article">Article / Guide</option>
              <option value="video">Video / Tutorial</option>
              <option value="course">Course / Syllabus</option>
              <option value="podcast">Podcast</option>
              <option value="other">General Link</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowLinkForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors cursor-pointer border-none"
            >
              Save Link
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedFilter("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
            selectedFilter === "all"
              ? "bg-foreground text-background border-foreground font-bold shadow-xs"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          )}
        >
          All Items ({files.length + links.length})
        </button>
        <button
          onClick={() => setSelectedFilter("images")}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
            selectedFilter === "images"
              ? "bg-foreground text-background border-foreground font-bold shadow-xs"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          )}
        >
          Images / JPGs ({imageFilesCount})
        </button>
        <button
          onClick={() => setSelectedFilter("documents")}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
            selectedFilter === "documents"
              ? "bg-foreground text-background border-foreground font-bold shadow-xs"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          )}
        >
          Documents ({docFilesCount})
        </button>
        <button
          onClick={() => setSelectedFilter("links")}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
            selectedFilter === "links"
              ? "bg-foreground text-background border-foreground font-bold shadow-xs"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          )}
        >
          Web Links ({links.length})
        </button>
      </div>

      {/* ─── Big Picture Files Gallery ─── */}
      {selectedFilter !== "links" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Uploaded Files & Images ({filteredFiles.length})
            </h3>
            <span className="text-[11px] text-muted-foreground">Click JPG image to expand full-screen</span>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
              <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold">No files uploaded in this category yet</p>
              <p className="text-xs mt-1">Upload JPG notes, whiteboard screenshots, or project images above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file) => {
                const isImage = file.category === "image" || file.type.startsWith("image/");
                return (
                  <div
                    key={file.id}
                    className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/50 transition-all duration-200 flex flex-col shadow-xs"
                  >
                    {/* Media Preview Box */}
                    {isImage ? (
                      <div
                        onClick={() => setLightboxImage(file)}
                        className="relative w-full aspect-video sm:aspect-4/3 bg-secondary/50 cursor-pointer overflow-hidden"
                      >
                        <img
                          src={file.dataUrl}
                          alt={file.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                          <Eye className="w-5 h-5 drop-shadow-md" />
                          <span className="text-xs font-bold drop-shadow-md">Preview</span>
                        </div>
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white font-bold uppercase">
                          {file.name.split(".").pop() || "IMG"}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-secondary/30 flex items-center justify-center text-muted-foreground">
                        <FileText className="w-12 h-12 text-primary/70" />
                      </div>
                    )}

                    {/* Meta info & Action bar */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4
                          className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors"
                          title={file.name}
                        >
                          {file.name}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                          <span>{formatSize(file.size)}</span>
                          <span>{formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-3 mt-2 border-t border-border/60">
                        {isImage && (
                          <button
                            onClick={() => setLightboxImage(file)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent"
                            title="Preview Image"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <a
                          href={file.dataUrl}
                          download={file.name}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border-none bg-transparent"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Resource Links Section ─── */}
      {(selectedFilter === "all" || selectedFilter === "links") && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Learning Resources & Web Links ({links.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all flex items-start justify-between group no-underline shadow-xs"
              >
                <div className="space-y-1 pr-2 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-primary">
                    {link.type}
                  </span>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate pt-1">
                    {link.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground truncate font-mono">{link.url}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteLink(link.id);
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-none bg-transparent"
                    title="Remove Link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── Full-screen Image Lightbox Modal ─── */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center bg-card rounded-2xl overflow-hidden border border-border shadow-2xl"
          >
            {/* Top Lightbox Bar */}
            <div className="w-full flex items-center justify-between px-4 py-3 bg-secondary/80 border-b border-border">
              <span className="text-xs font-bold text-foreground truncate max-w-md">{lightboxImage.name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.dataUrl}
                  download={lightboxImage.name}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* High-res Image View */}
            <div className="p-2 sm:p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-background/50">
              <img
                src={lightboxImage.dataUrl}
                alt={lightboxImage.name}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>

            {/* Bottom Info Bar */}
            <div className="w-full px-4 py-2 bg-secondary/40 text-[11px] font-mono text-muted-foreground flex justify-between border-t border-border">
              <span>Size: {formatSize(lightboxImage.size)}</span>
              <span>Uploaded: {formatDate(lightboxImage.uploadedAt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardMedia;
