import React, { useState, useEffect, useRef, useMemo } from "react";
import { db, auth } from "../firebase";
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
} from "lucide-react";
import EmojiPicker from "./EmojiPicker";

interface ChatUser {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
}

interface ChatMessage {
  id: string;
  text?: string;
  senderId?: string;
  timestamp?: any;
  reactions?: Record<string, string[]>; // { [emoji]: [userId1, userId2] }
}

interface ChatboxProps {
  selectedUser: ChatUser;
}

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

  // Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatId) return;

    const messageData = {
      text: newMessage.trim(),
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      reactions: {},
    };

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);
      setNewMessage("");
      setIsInputEmojiOpen(false);
    } catch (err) {
      console.error("Error sending message:", err);
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
    const media: { url: string; time: string; sender: string }[] = [];
    const docsList: { name: string; url: string; time: string; sender: string }[] = [];

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

      if (msg.text) {
        const matches = msg.text.match(urlRegex);
        if (matches) {
          matches.forEach((u) => {
            if (/\.(jpg|jpeg|png|gif|webp|svg)/i.test(u)) {
              media.push({ url: u, time, sender });
            } else if (/\.(pdf|doc|docx|zip|txt|json)/i.test(u)) {
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
    >
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
                  className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-sm transition-all cursor-default relative ${
                    isMe
                      ? "bg-primary/20 text-foreground border border-primary/30 rounded-tr-xs"
                      : "bg-secondary text-secondary-foreground border border-border rounded-tl-xs"
                  } ${isSearchMatch ? "ring-2 ring-primary shadow-lg" : ""}`}
                >
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

        {/* Attachment Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Attach media or document"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border">
            <DropdownMenuItem className="text-xs cursor-pointer">
              <ImageIcon className="w-4 h-4 mr-2" /> Photos & Videos
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs cursor-pointer">
              <Camera className="w-4 h-4 mr-2" /> Camera
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs cursor-pointer">
              <FileIcon className="w-4 h-4 mr-2" /> Document
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs cursor-pointer">
              <UserRound className="w-4 h-4 mr-2" /> Contact
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs cursor-pointer">
              <ChartBarIncreasing className="w-4 h-4 mr-2" /> Poll
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs cursor-pointer">
              <Brush className="w-4 h-4 mr-2" /> Drawing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          className="flex-grow bg-secondary/50 border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
          placeholder="Type a message (or right-click messages to react)"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary disabled:opacity-40 cursor-pointer"
          disabled={!newMessage.trim()}
          title="Send message"
        >
          <Send className="w-4 h-4" />
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
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square rounded-md overflow-hidden border border-border hover:opacity-90 transition-opacity"
                      >
                        <img src={item.url} alt="Media" className="w-full h-full object-cover" />
                      </a>
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
                    <a
                      key={idx}
                      href={docItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs transition-colors"
                    >
                      <FileIcon className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{docItem.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {docItem.sender} • {docItem.time}
                        </p>
                      </div>
                    </a>
                  ))
                )}
              </>
            )}
          </div>
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
