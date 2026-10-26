import React, { useState, useEffect, useRef } from "react";
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
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Video,
  Phone,
  Search,
  Smile,
  Paperclip,
  Send,
  Mic,
  Image,
  Camera,
  File,
  UserRound,
  ChartBarIncreasing,
  Brush,
} from "lucide-react";

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
}

interface ChatboxProps {
  selectedUser: ChatUser;
}

const Chatbox: React.FC<ChatboxProps> = ({ selectedUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [actualName, setActualName] = useState<string>(selectedUser.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string>(selectedUser.avatarUrl || "");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const currentUser = auth.currentUser;
  const chatId =
    currentUser && currentUser.uid > selectedUser.id
      ? `${currentUser.uid}_${selectedUser.id}`
      : currentUser
      ? `${selectedUser.id}_${currentUser.uid}`
      : "";

  useEffect(() => {
    if (selectedUser.name) setActualName(selectedUser.name);
    if (selectedUser.avatarUrl) setAvatarUrl(selectedUser.avatarUrl);

    const fetchUserDetails = async () => {
      if (selectedUser.id === "friend-soul") {
        setActualName("Soul Honest");
        return;
      }
      if (selectedUser.id === "friend-kritika") {
        setActualName("Kritika Sharma");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", selectedUser.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.name) setActualName(data.name);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        }
      } catch (err) {
        console.error("Error fetching user details in ChatBox:", err);
      }
    };

    fetchUserDetails();
  }, [selectedUser.id, selectedUser.name]);

  const displayName = actualName || selectedUser.name || selectedUser.username;

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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatId) return;

    const messageData = {
      text: newMessage.trim(),
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex flex-col h-full flex-1 min-w-0 bg-background text-foreground">
      {/* Chat Header from chattemplate.txt */}
      <div className="h-14 border-b border-border flex items-center px-4 justify-between bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-secondary text-foreground text-sm font-semibold">
              {(displayName?.[0] || selectedUser.username?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-foreground">
              {displayName}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>@{selectedUser.username}</span>
              <span>•</span>
              <span className="text-emerald-500 font-medium">Online</span>
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 bg-background [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
            <p>No messages yet. Say hello to {displayName}!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = currentUser && msg.senderId === currentUser.uid;
          const time = msg.timestamp
            ? new Date(
                msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Sending...";

          return (
            <div
              key={msg.id}
              className={`max-w-[75%] px-3.5 py-1.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                isMe
                  ? "self-end bg-primary/20 text-foreground border border-primary/30 rounded-tr-sm"
                  : "self-start bg-secondary text-secondary-foreground border border-border rounded-tl-sm"
              }`}
            >
              <div className="flex items-baseline gap-2.5 justify-between">
                <span className="break-words select-text">{msg.text}</span>
                <span
                  className={`text-[10px] shrink-0 font-normal select-none ${
                    isMe ? "text-primary/80" : "text-muted-foreground"
                  }`}
                >
                  {time}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Chat Input from chattemplate.txt */}
      <form
        className="flex items-center gap-2 p-3 border-t border-border bg-card shrink-0"
        onSubmit={handleSend}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Smile className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border">
            <DropdownMenuItem className="text-xs">
              <Image className="w-4 h-4 mr-2" /> Photos & Videos
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Camera className="w-4 h-4 mr-2" /> Camera
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <File className="w-4 h-4 mr-2" /> Document
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <UserRound className="w-4 h-4 mr-2" /> Contact
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <ChartBarIncreasing className="w-4 h-4 mr-2" /> Poll
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs">
              <Brush className="w-4 h-4 mr-2" /> Drawing
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          className="flex-grow bg-secondary/50 border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary disabled:opacity-40"
          disabled={!newMessage.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Mic className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default Chatbox;
