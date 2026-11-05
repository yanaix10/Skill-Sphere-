import React, { useState, useEffect, useRef, useMemo } from "react";
import { db, auth, storage } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Video,
  Phone,
  Search,
  Smile,
  SmilePlus,
  Paperclip,
  Send,
  Mic,
  Image as ImageIcon,
  Camera,
  File as FileIcon,
  UserRound,
  ChartBarIncreasing,
  Brush,
  MoreVertical,
  Bell,
  BellOff,
  Trash2,
  Palette,
  FileText,
  Link2,
  X,
  ChevronUp,
  ChevronDown,
  Check,
  Plus,
  Download,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  UploadCloud,
  Loader2,
  Eye,
} from "lucide-react";
import EmojiPicker from "./EmojiPicker";

interface ChatUser {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
}

export interface ChatAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
  category: "media" | "docs" | "file";
}

export interface ChatMessage {
  id: string;
  text?: string;
  senderId?: string;
  timestamp?: any;
  reactions?: Record<string, string[]>; // { [emoji]: [userId1, userId2] }
  file?: ChatAttachment;
}

interface ChatboxProps {
  selectedUser: ChatUser;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileCategory = (file: File): "media" | "docs" | "file" => {
  if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
    return "media";
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (
    [
      "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
      "json", "zip", "rar", "tar", "gz", "js", "ts", "tsx", "py", "html",
      "css", "md", "sql", "xml", "yaml", "yml"
    ].includes(ext)
  ) {
    return "docs";
  }
  return "file";
};

const getDocIcon = (name: string, type?: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") {
    return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />;
  }
  if (["js", "ts", "tsx", "py", "json", "html", "css", "cpp", "c", "java", "sql"].includes(ext)) {
    return <FileCode className="w-5 h-5 text-cyan-400 shrink-0" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className="w-5 h-5 text-amber-500 shrink-0" />;
  }
  return <FileText className="w-5 h-5 text-blue-400 shrink-0" />;
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const THEMES = [
  {
    id: "default",
    name: "Default (Adaptive)",
    bgClass: "bg-background",
    accent: "border-border",
    preview: "bg-zinc-900 border-zinc-700",
  },
  {
    id: "midnight",
    name: "Midnight Glass",
    bgClass: "bg-[#090D16] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]",
    accent: "border-indigo-900/40",
    preview: "bg-[#090D16] border-indigo-500/50",
  },
  {
    id: "emerald",
    name: "Emerald Matrix",
    bgClass: "bg-[#04140E] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]",
    accent: "border-emerald-900/40",
    preview: "bg-[#04140E] border-emerald-500/50",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    bgClass: "bg-[#100720] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,70,239,0.15),rgba(255,255,255,0))]",
    accent: "border-fuchsia-900/40",
    preview: "bg-[#100720] border-fuchsia-500/50",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Classic",
    bgClass: "bg-[#0B141A] bg-[radial-gradient(#1B2D38_1px,transparent_1px)] [background-size:16px_16px]",
    accent: "border-slate-800",
    preview: "bg-[#0B141A] border-teal-500/50",
  },
  {
    id: "amber",
    name: "Warm Amber",
    bgClass: "bg-[#140E0A] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.12),rgba(255,255,255,0))]",
    accent: "border-amber-900/40",
    preview: "bg-[#140E0A] border-amber-500/50",
  },
];

export const Chatbox: React.FC<ChatboxProps> = ({ selectedUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [actualName, setActualName] = useState<string>(selectedUser.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string>(selectedUser.avatarUrl || "");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // WhatsApp Features State
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [fullEmojiPickerForMsgId, setFullEmojiPickerForMsgId] = useState<string | null>(null);
  const [isInputEmojiOpen, setIsInputEmojiOpen] = useState(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  // Header 3-Dot Dialogs
  const [isMediaDocsOpen, setIsMediaDocsOpen] = useState(false);
  const [mediaDocsTab, setMediaDocsTab] = useState<"media" | "docs" | "links">("links");
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [isClearChatConfirmOpen, setIsClearChatConfirmOpen] = useState(false);

  // Notification Mute & Theme Persistence
  const currentUser = auth.currentUser;
  const chatId =
    currentUser && currentUser.uid > selectedUser.id
      ? `${currentUser.uid}_${selectedUser.id}`
      : currentUser
      ? `${selectedUser.id}_${currentUser.uid}`
      : "";

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem(`skillsphere_muted_${chatId}`) === "true";
  });

  const [chatTheme, setChatTheme] = useState<string>(() => {
    return localStorage.getItem(`skillsphere_chat_theme_${chatId}`) || "default";
  });

  // File and Document Sharing State
  interface StagedFile {
    file: File;
    previewUrl?: string;
    category: "media" | "docs" | "file";
  }

  const [stagedFile, setStagedFile] = useState<StagedFile | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const generalFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFile = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      alert("File is too large. Maximum supported size is 25MB.");
      return;
    }
    const category = getFileCategory(file);
    let previewUrl: string | undefined;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }
    setStagedFile({
      file,
      category,
      previewUrl,
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectFile(file);
    }
    e.target.value = "";
  };

  const clearStagedFile = () => {
    if (stagedFile?.previewUrl) {
      URL.revokeObjectURL(stagedFile.previewUrl);
    }
    setStagedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `chats/${chatId}/${timestamp}_${safeName}`;

    try {
      const fileRef = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(fileRef, file);

      return await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            }
          },
          (error) => {
            console.warn("Storage upload error, attempting data URL fallback:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadUrl);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (err) {
      // Fallback for dev environment or if Firebase storage rules block upload
      if (file.size <= 2 * 1024 * 1024) {
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
      }
      throw new Error("Could not upload file. Please keep files under 2MB for direct delivery.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectFile(file);
    }
  };

  // Fetch Live User Details for Chat Header
  useEffect(() => {
    if (selectedUser.name) setActualName(selectedUser.name);
    if (selectedUser.avatarUrl) setAvatarUrl(selectedUser.avatarUrl);

    if (selectedUser.id === "friend-soul") {
      setActualName("Soul Honest");
      return;
    }
    if (selectedUser.id === "friend-kritika") {
      setActualName("Kritika Sharma");
      return;
    }

    const unsub = onSnapshot(doc(db, "users", selectedUser.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.name) setActualName(data.name);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
      }
    });

    return () => unsub();
  }, [selectedUser.id, selectedUser.name]);

  const displayName = actualName || selectedUser.name || selectedUser.username;

  // Real-time Messages Listener
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as ChatMessage)
        )
      );
    });

    return () => unsubscribe();
  }, [chatId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!isSearchOpen) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSearchOpen]);

  // Send Message (Text and/or File)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !stagedFile) || !currentUser || !chatId) return;

    try {
      let fileAttachment: ChatAttachment | undefined;

      if (stagedFile) {
        setIsUploading(true);
        setUploadProgress(15);
        const fileUrl = await uploadFile(stagedFile.file);
        fileAttachment = {
          url: fileUrl,
          name: stagedFile.file.name,
          size: stagedFile.file.size,
          type: stagedFile.file.type || "application/octet-stream",
          category: stagedFile.category,
        };
      }

      const messageData: any = {
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        reactions: {},
      };

      if (newMessage.trim()) {
        messageData.text = newMessage.trim();
      }

      if (fileAttachment) {
        messageData.file = fileAttachment;
      }

      await addDoc(collection(db, "chats", chatId, "messages"), messageData);
      setNewMessage("");
      clearStagedFile();
      setIsInputEmojiOpen(false);
    } catch (err: any) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + (err.message || "Unknown error"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // WhatsApp Reaction Toggle
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser || !chatId) return;
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg) return;

    const currentReactions: Record<string, string[]> = targetMsg.reactions || {};
    const existingUsers = currentReactions[emoji] || [];
    let updatedUsers: string[];

    if (existingUsers.includes(currentUser.uid)) {
      // Toggle off
      updatedUsers = existingUsers.filter((uid) => uid !== currentUser.uid);
    } else {
      // Toggle on
      updatedUsers = [...existingUsers, currentUser.uid];
    }

    const updatedReactions: Record<string, string[]> = { ...currentReactions };
    if (updatedUsers.length > 0) {
      updatedReactions[emoji] = updatedUsers;
    } else {
      delete updatedReactions[emoji];
    }

    // Optimistic state update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, reactions: updatedReactions } : m
      )
    );
    setActiveReactionMessageId(null);
    setFullEmojiPickerForMsgId(null);

    // Save to Firestore
    try {
      await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
        reactions: updatedReactions,
      });
    } catch (err) {
      console.error("Error updating reaction:", err);
    }
  };

  // Toggle Mute Notifications
  const handleToggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    localStorage.setItem(`skillsphere_muted_${chatId}`, String(nextState));
  };

  // Change Theme
  const handleSelectTheme = (themeId: string) => {
    setChatTheme(themeId);
    localStorage.setItem(`skillsphere_chat_theme_${chatId}`, themeId);
    setIsThemeDialogOpen(false);
  };

  // Clear Chat
  const handleClearChat = async () => {
    if (!chatId) return;
    try {
      const q = query(collection(db, "chats", chatId, "messages"));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setMessages([]);
      setIsClearChatConfirmOpen(false);
    } catch (err) {
      console.error("Error clearing chat:", err);
    }
  };

  // Date and Time Corridor Formatter
  const getDateLabel = (timestamp: any): { label: string; key: string } => {
    if (!timestamp) return { label: "Today", key: "today" };
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (isToday) return { label: "Today", key };
    if (isYesterday) return { label: "Yesterday", key };

    const diffMs = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 6) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return { label: dayNames[date.getDay()], key };
    }

    // Example: "21 Oct 2026"
    return {
      label: date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      key,
    };
  };

  // Extracted Media, Docs & Links from Chat
  const mediaDocsData = useMemo(() => {
    const links: { url: string; time: string; sender: string }[] = [];
    const media: { url: string; time: string; sender: string; name?: string; isVideo?: boolean }[] = [];
    const docsList: { name: string; url: string; size?: number; time: string; sender: string }[] = [];

    const urlRegex = /(https?:\/\/[^\s]+)/gi;

    messages.forEach((msg) => {
      const isMe = currentUser && msg.senderId === currentUser.uid;
      const sender = isMe ? "You" : displayName;
      const time = msg.timestamp
        ? new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      // 1. Check for attached file/document
      if (msg.file) {
        if (
          msg.file.category === "media" ||
          msg.file.type?.startsWith("image/") ||
          msg.file.type?.startsWith("video/")
        ) {
          media.push({
            url: msg.file.url,
            name: msg.file.name,
            isVideo: msg.file.type?.startsWith("video/"),
            time,
            sender,
          });
        } else {
          docsList.push({
            name: msg.file.name,
            url: msg.file.url,
            size: msg.file.size,
            time,
            sender,
          });
        }
      }

      // 2. Check for URL text matches
      if (msg.text) {
        const matches = msg.text.match(urlRegex);
        if (matches) {
          matches.forEach((u) => {
            if (/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm)/i.test(u)) {
              media.push({ url: u, time, sender });
            } else if (/\.(pdf|doc|docx|zip|txt|json|xls|xlsx|csv)/i.test(u)) {
              docsList.push({ name: u.split("/").pop() || "Document", url: u, time, sender });
            } else {
              links.push({ url: u, time, sender });
            }
          });
        }
      }
    });

    return { links, media, docs: docsList };
  }, [messages, currentUser, displayName]);

  // Search Filtering & Highlighting
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.text?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const activeThemeObj = THEMES.find((t) => t.id === chatTheme) || THEMES[0];

  return (
    <div
      className={`flex flex-col h-full flex-1 min-w-0 ${activeThemeObj.bgClass} text-foreground transition-colors duration-300 relative`}
      onClick={() => {
        if (activeReactionMessageId) setActiveReactionMessageId(null);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop File Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-background/85 backdrop-blur-sm border-2 border-dashed border-primary flex flex-col items-center justify-center gap-3 p-6 pointer-events-none animate-in fade-in-50 duration-150">
          <UploadCloud className="w-14 h-14 text-primary animate-bounce" />
          <p className="text-base font-bold text-foreground">Drop file or document here to share</p>
          <p className="text-xs text-muted-foreground">
            Share code, PDFs, sheets, images, and videos with {displayName}
          </p>
        </div>
      )}
      {/* Chat Header */}
      <div className="h-14 border-b border-border/80 flex items-center px-4 justify-between bg-card/90 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-9 shrink-0 border border-border/60">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-secondary text-foreground text-sm font-semibold">
              {(displayName?.[0] || selectedUser.username?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                {displayName}
              </CardTitle>
              {isMuted && (
                <span title="Notifications muted">
                  <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                </span>
              )}
            </div>
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="truncate">@{selectedUser.username}</span>
              <span>•</span>
              <span className="text-emerald-500 font-medium">Online</span>
            </CardDescription>
          </div>
        </div>

        {/* Top Actions: Video, Audio, Search, 3-Dots */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Voice call"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`h-8 w-8 cursor-pointer ${
              isSearchOpen ? "text-primary bg-secondary/80" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Three-Dot Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                title="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-md border-border shadow-2xl p-1.5">
              <DropdownMenuItem
                className="text-xs py-2 cursor-pointer flex items-center gap-2.5 rounded-md"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span>Search in conversation</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-xs py-2 cursor-pointer flex items-center gap-2.5 rounded-md"
                onClick={() => setIsMediaDocsOpen(true)}
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Media, docs & links</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-xs py-2 cursor-pointer flex items-center gap-2.5 rounded-md"
                onClick={handleToggleMute}
              >
                {isMuted ? (
                  <>
                    <Bell className="w-4 h-4 text-primary" />
                    <span>Unmute notifications</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                    <span>Mute notifications</span>
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-xs py-2 cursor-pointer flex items-center gap-2.5 rounded-md"
                onClick={() => setIsThemeDialogOpen(true)}
              >
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span>Chat theme options</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border/60 my-1" />

              <DropdownMenuItem
                className="text-xs py-2 cursor-pointer flex items-center gap-2.5 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md"
                onClick={() => setIsClearChatConfirmOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear chat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* In-Chat Search Bar */}
      {isSearchOpen && (
        <div className="border-b border-border bg-card/95 backdrop-blur-sm px-4 py-2 flex items-center gap-3 shrink-0 z-10 animate-in slide-in-from-top-2 duration-200">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search in this chat..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveSearchIndex(0);
            }}
            className="h-8 text-xs bg-secondary/50 border-border flex-1"
            autoFocus
          />
          {searchQuery && (
            <span className="text-xs text-muted-foreground shrink-0 font-medium">
              {searchMatches.length} {searchMatches.length === 1 ? "match" : "matches"}
            </span>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              disabled={searchMatches.length <= 1}
              onClick={() => {
                setActiveSearchIndex((prev) =>
                  prev > 0 ? prev - 1 : searchMatches.length - 1
                );
              }}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              disabled={searchMatches.length <= 1}
              onClick={() => {
                setActiveSearchIndex((prev) =>
                  prev < searchMatches.length - 1 ? prev + 1 : 0
                );
              }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages Feed with WhatsApp-style Date Corridor & Message Reactions */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
            <div className="size-12 rounded-full bg-secondary/60 flex items-center justify-center mb-3 text-muted-foreground">
              <Smile className="w-6 h-6" />
            </div>
            <p className="font-medium text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Say hello to {displayName} to start the conversation!</p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = currentUser && msg.senderId === currentUser.uid;
          const time = msg.timestamp
            ? new Date(
                msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Sending...";

          // Compute WhatsApp-style Date Corridor
          const currentDateInfo = getDateLabel(msg.timestamp);
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const prevDateInfo = prevMsg ? getDateLabel(prevMsg.timestamp) : null;
          const showDateCorridor = !prevDateInfo || prevDateInfo.key !== currentDateInfo.key;

          const isReactionOpen = activeReactionMessageId === msg.id;
          const isSearchMatch =
            searchQuery.trim() &&
            msg.text?.toLowerCase().includes(searchQuery.toLowerCase());

          return (
            <React.Fragment key={msg.id}>
              {/* WhatsApp-Style Date Corridor Pill */}
              {showDateCorridor && (
                <div className="flex justify-center my-3 select-none">
                  <span className="text-[11px] font-semibold tracking-wider px-3.5 py-1 rounded-full bg-secondary/80 text-muted-foreground shadow-xs border border-border/50 backdrop-blur-md uppercase">
                    {currentDateInfo.label}
                  </span>
                </div>
              )}

              {/* Message Bubble Row */}
              <div
                className={`relative flex items-center group ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {/* Left hover reaction trigger (for my messages) */}
                {isMe && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactionMessageId(isReactionOpen ? null : msg.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 mr-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Add reaction (or right click)"
                  >
                    <SmilePlus className="w-4 h-4" />
                  </button>
                )}

                {/* Floating WhatsApp Quick Reaction Bar */}
                {isReactionOpen && (
                  <div
                    className={`absolute -top-11 z-40 bg-card/95 backdrop-blur-md border border-border rounded-full shadow-2xl px-2 py-1 flex items-center gap-1.5 animate-in zoom-in-95 duration-150 ${
                      isMe ? "right-2" : "left-2"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {QUICK_REACTIONS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleToggleReaction(msg.id, em)}
                        className="text-lg hover:scale-130 active:scale-95 transition-transform duration-100 p-1 cursor-pointer"
                        title={em}
                      >
                        {em}
                      </button>
                    ))}

                    <Popover
                      open={fullEmojiPickerForMsgId === msg.id}
                      onOpenChange={(open) =>
                        setFullEmojiPickerForMsgId(open ? msg.id : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="size-7 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                          title="More emojis"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align={isMe ? "end" : "start"}
                        className="p-0 border-none bg-transparent shadow-none w-auto"
                      >
                        <EmojiPicker
                          onSelect={(emoji) => handleToggleReaction(msg.id, emoji)}
                          onClose={() => setFullEmojiPickerForMsgId(null)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveReactionMessageId(isReactionOpen ? null : msg.id);
                  }}
                  className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm transition-all cursor-default relative ${
                    isMe
                      ? "bg-primary/20 text-foreground border border-primary/30 rounded-tr-xs"
                      : "bg-secondary text-secondary-foreground border border-border rounded-tl-xs"
                  } ${isSearchMatch ? "ring-2 ring-primary shadow-lg" : ""}`}
                >
                  {/* File / Document Attachment */}
                  {msg.file && (
                    <div className="mb-2">
                      {msg.file.category === "media" && msg.file.type?.startsWith("image/") ? (
                        <div className="relative group/media overflow-hidden rounded-xl border border-border/70 max-w-sm bg-black/20">
                          <img
                            src={msg.file.url}
                            alt={msg.file.name}
                            onClick={() => setViewingImageUrl(msg.file!.url)}
                            className="w-full max-h-72 object-cover rounded-xl cursor-pointer hover:scale-[1.01] transition-transform duration-200"
                          />
                          <a
                            href={msg.file.url}
                            download={msg.file.name}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-black text-white opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-medium shadow-md"
                            title="Download image"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : msg.file.category === "media" && msg.file.type?.startsWith("video/") ? (
                        <div className="relative overflow-hidden rounded-xl border border-border/70 max-w-sm">
                          <video
                            src={msg.file.url}
                            controls
                            className="w-full max-h-72 rounded-xl bg-black/80"
                          />
                        </div>
                      ) : (
                        /* Document / File Card */
                        <div
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                            isMe
                              ? "bg-background/50 border-primary/30 hover:bg-background/70"
                              : "bg-background/60 border-border hover:bg-background/90"
                          }`}
                        >
                          <div className="size-10 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0 border border-border">
                            {getDocIcon(msg.file.name, msg.file.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                              {msg.file.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span>{formatFileSize(msg.file.size)}</span>
                              <span>•</span>
                              <span className="uppercase text-[9px] font-mono font-bold text-primary">
                                {msg.file.name.split(".").pop() || "DOC"}
                              </span>
                            </p>
                          </div>
                          <a
                            href={msg.file.url}
                            download={msg.file.name}
                            target="_blank"
                            rel="noreferrer"
                            className="size-8 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center text-foreground transition-colors shrink-0 cursor-pointer"
                            title={`Download ${msg.file.name}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-baseline gap-3 justify-between">
                    <span className="break-words select-text">
                      {isSearchMatch && searchQuery.trim() ? (
                        <span>
                          {msg.text?.split(new RegExp(`(${searchQuery})`, "gi")).map((part, i) =>
                            part.toLowerCase() === searchQuery.toLowerCase() ? (
                              <mark
                                key={i}
                                className="bg-primary/40 text-foreground px-0.5 rounded font-semibold"
                              >
                                {part}
                              </mark>
                            ) : (
                              part
                            )
                          )}
                        </span>
                      ) : (
                        msg.text
                      )}
                    </span>
                    <span
                      className={`text-[10px] shrink-0 font-normal select-none ${
                        isMe ? "text-primary/80" : "text-muted-foreground"
                      }`}
                    >
                      {time}
                    </span>
                  </div>

                  {/* Reaction Badges Clustered on Bubble */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div
                      className={`flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-border/30 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {Object.entries(msg.reactions).map(([emoji, uids]) => {
                        if (!uids || uids.length === 0) return null;
                        const didIReact = currentUser && uids.includes(currentUser.uid);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReaction(msg.id, emoji);
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all cursor-pointer ${
                              didIReact
                                ? "bg-primary/25 border border-primary/60 text-foreground font-semibold shadow-xs"
                                : "bg-card/90 hover:bg-card border border-border/80 text-foreground"
                            }`}
                            title={
                              didIReact
                                ? `You${uids.length > 1 ? ` and ${uids.length - 1} other` : ""} reacted with ${emoji}`
                                : `${uids.length} reacted with ${emoji}`
                            }
                          >
                            <span>{emoji}</span>
                            {uids.length > 1 && (
                              <span className="text-[10px] font-bold opacity-80">{uids.length}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right hover reaction trigger (for other friend's messages) */}
                {!isMe && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactionMessageId(isReactionOpen ? null : msg.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 ml-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Add reaction (or right click)"
                  >
                    <SmilePlus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* File & Document Staging Preview */}
      {stagedFile && (
        <div className="mx-4 mb-2 p-2.5 rounded-xl bg-card border border-border flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-bottom-2 duration-150 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {stagedFile.previewUrl && stagedFile.file.type.startsWith("image/") ? (
              <img
                src={stagedFile.previewUrl}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0 border border-border">
                {getDocIcon(stagedFile.file.name, stagedFile.file.type)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[320px]">
                {stagedFile.file.name}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{formatFileSize(stagedFile.file.size)}</span>
                <span>•</span>
                <span className="uppercase text-[9px] font-mono text-primary font-bold">
                  {stagedFile.file.name.split(".").pop() || stagedFile.category}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUploading ? (
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium px-2 py-1 rounded-md bg-primary/10">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[11px] font-mono">{uploadProgress}%</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                onClick={clearStagedFile}
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        className="flex items-center gap-2 p-3 border-t border-border/80 bg-card/90 backdrop-blur-md shrink-0 z-10"
        onSubmit={handleSend}
      >
        {/* Emoji Collection Button for input message */}
        <Popover open={isInputEmojiOpen} onOpenChange={setIsInputEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Insert Emoji"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="p-0 border-none bg-transparent shadow-none w-auto"
          >
            <EmojiPicker
              onSelect={(emoji) => {
                setNewMessage((prev) => prev + emoji);
              }}
              onClose={() => setIsInputEmojiOpen(false)}
            />
          </PopoverContent>
        </Popover>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={mediaInputRef}
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <input
          type="file"
          ref={docInputRef}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.zip,.rar,.tar,.gz,.js,.ts,.tsx,.py,.html,.css,.md"
          className="hidden"
          onChange={handleFileInputChange}
        />
        <input
          type="file"
          ref={generalFileInputRef}
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Attachment Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Attach media or document"
              disabled={isUploading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border min-w-[190px]">
            <DropdownMenuItem
              className="text-xs cursor-pointer flex items-center gap-2.5 py-2"
              onClick={() => mediaInputRef.current?.click()}
            >
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Photos & Videos</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs cursor-pointer flex items-center gap-2.5 py-2"
              onClick={() => docInputRef.current?.click()}
            >
              <FileIcon className="w-4 h-4 text-blue-400" />
              <span>Document (PDF, Code, Office)</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs cursor-pointer flex items-center gap-2.5 py-2"
              onClick={() => generalFileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4 text-emerald-400" />
              <span>Any File or Archive</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          className="flex-grow bg-secondary/50 border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
          placeholder={
            stagedFile
              ? `Add a caption for "${stagedFile.file.name}"... (optional)`
              : "Type a message or drag & drop files here..."
          }
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isUploading}
        />

        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary disabled:opacity-40 cursor-pointer"
          disabled={(!newMessage.trim() && !stagedFile) || isUploading}
          title={stagedFile ? "Send file and caption" : "Send message"}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          title="Voice message"
        >
          <Mic className="w-4 h-4" />
        </Button>
      </form>

      {/* Media, Docs & Links Dialog */}
      <Dialog open={isMediaDocsOpen} onOpenChange={setIsMediaDocsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Media, Docs & Links</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Files and links shared in your conversation with {displayName}.
            </DialogDescription>
          </DialogHeader>

          {/* Subtabs */}
          <div className="flex border-b border-border/80 gap-4 mt-2">
            <button
              type="button"
              onClick={() => setMediaDocsTab("media")}
              className={`pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
                mediaDocsTab === "media"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Media ({mediaDocsData.media.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaDocsTab("docs")}
              className={`pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
                mediaDocsTab === "docs"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Docs ({mediaDocsData.docs.length})
            </button>
            <button
              type="button"
              onClick={() => setMediaDocsTab("links")}
              className={`pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
                mediaDocsTab === "links"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Links ({mediaDocsData.links.length})
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto py-3 space-y-2">
            {mediaDocsTab === "links" && (
              <>
                {mediaDocsData.links.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No links shared in this conversation yet.
                  </div>
                ) : (
                  mediaDocsData.links.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs transition-colors group"
                    >
                      <Link2 className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{item.url}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.sender} • {item.time}
                        </p>
                      </div>
                    </a>
                  ))
                )}
              </>
            )}

            {mediaDocsTab === "media" && (
              <>
                {mediaDocsData.media.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No photos or videos shared yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaDocsData.media.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-square rounded-md overflow-hidden border border-border bg-secondary/30"
                      >
                        {item.isVideo ? (
                          <video src={item.url} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.name || "Media"}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setViewingImageUrl(item.url)}
                          />
                        )}
                        <a
                          href={item.url}
                          download={item.name || "media"}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-1 right-1 p-1 rounded bg-black/80 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {mediaDocsTab === "docs" && (
              <>
                {mediaDocsData.docs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    <FileIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No documents shared yet.
                  </div>
                ) : (
                  mediaDocsData.docs.map((docItem, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {getDocIcon(docItem.name)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{docItem.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {docItem.sender} • {docItem.time}
                            {docItem.size ? ` • ${formatFileSize(docItem.size)}` : ""}
                          </p>
                        </div>
                      </div>
                      <a
                        href={docItem.url}
                        download={docItem.name}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-md hover:bg-card text-muted-foreground hover:text-primary transition-colors shrink-0"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Preview Dialog */}
      <Dialog open={!!viewingImageUrl} onOpenChange={() => setViewingImageUrl(null)}>
        <DialogContent className="max-w-3xl bg-card/95 border-border text-foreground p-4 flex flex-col items-center">
          <div className="w-full flex justify-end gap-2 mb-2">
            <a
              href={viewingImageUrl || ""}
              download="image"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 px-3 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
          {viewingImageUrl && (
            <img
              src={viewingImageUrl}
              alt="Full Preview"
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain border border-border shadow-xl"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Theme Selector Dialog */}
      <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Choose Chat Wallpaper & Theme</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a visual mood for this conversation. Your choice is automatically saved.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-3">
            {THEMES.map((th) => {
              const isSelected = chatTheme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => handleSelectTheme(th.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/40 bg-secondary"
                      : "border-border/80 hover:border-primary/50 hover:bg-secondary/40"
                  }`}
                >
                  <div className={`h-12 w-full rounded-lg ${th.preview} flex items-center justify-center`}>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold block text-foreground">{th.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Chat Confirmation Dialog */}
      <Dialog open={isClearChatConfirmOpen} onOpenChange={setIsClearChatConfirmOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive">Clear this chat?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will permanently delete all messages in this conversation for both participants. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearChatConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearChat}
            >
              Clear Messages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chatbox;
