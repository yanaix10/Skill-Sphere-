import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Laptop, Check, Bell, MessageSquare, ExternalLink, CheckCheck } from "lucide-react";
import ProfileDialog from "@/components/ui/profile-dialog";
import { useTheme } from "../context/ThemeContext";
import { cn } from "@/lib/utils";

interface FriendMessageNotification {
  id: string;
  friendId: string;
  friendName: string;
  avatarUrl?: string;
  messageText: string;
  timestamp: string;
  isRead: boolean;
}

const DEFAULT_NOTIFICATIONS: FriendMessageNotification[] = [];

const authenticatedLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/quizzes", label: "Quizzes & duels" },
  { href: "/friends", label: "Friends" },
];

const publicLinks = [
  { href: "/", label: "Overview" },
  { href: "/quizzes", label: "Quizzes & duels" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export default function Navbar() {
  const [fullName, setFullName] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<FriendMessageNotification[]>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_friend_notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Purge any stored notifications that contain hardcoded demo data
        const hasLegacy = parsed.some((n: any) =>
          ["friend-soul", "friend-kritika", "friend-izuku"].includes(n.friendId)
        );
        if (hasLegacy) {
          localStorage.removeItem("skillsphere_friend_notifications");
          return [];
        }
        return parsed;
      }
    } catch {}
    return DEFAULT_NOTIFICATIONS;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    try {
      localStorage.setItem("skillsphere_friend_notifications", JSON.stringify(updated));
    } catch {}
  };

  const handleOpenFriendChat = (notifId: string, _friendId: string) => {
    const updated = notifications.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
    setNotifications(updated);
    try {
      localStorage.setItem("skillsphere_friend_notifications", JSON.stringify(updated));
    } catch {}
    navigate("/friends");
  };

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        if (currentUser.uid === "test-user-123") {
          const local = localStorage.getItem("skillsphere_dev_profile");
          if (local) {
            try {
              const data = JSON.parse(local);
              if (data.name) {
                setFullName(data.name);
                return;
              }
            } catch (e) {}
          }
          setFullName(currentUser.displayName || "Developer");
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setFullName(userDoc.data().name as string);
          }
        } catch (error) {
          console.error("Error fetching user name:", error);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("skillsphere_dev_auth");
    signOut(auth);
    navigate("/");
  };

  const currentUser = auth.currentUser;

  return (
    <>
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-md px-4 md:px-6 shrink-0 transition-colors duration-200 z-20">
        <div className="flex h-16 justify-between items-center gap-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center md:hidden">
              {/* Mobile menu trigger */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="group size-8" variant="ghost" size="icon">
                    <svg
                      className="pointer-events-none"
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path
                        d="M4 12L20 12"
                        className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                      />
                      <path
                        d="M4 12H20"
                        className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                      />
                      <path
                        d="M4 12H20"
                        className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                      />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-40 p-2 md:hidden bg-card border-border">
                  <NavigationMenu className="max-w-none *:w-full">
                    <NavigationMenuList className="flex-col items-start gap-1">
                      {(currentUser ? authenticatedLinks : publicLinks).map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          <Link
                            to={link.href}
                            className="block py-1.5 px-3 rounded text-sm text-muted-foreground hover:text-primary hover:bg-secondary no-underline"
                          >
                            {link.label}
                          </Link>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            </div>

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 text-foreground hover:opacity-95 font-semibold text-base no-underline tracking-tight group shrink-0"
            >
              <img
                src="/logo.png"
                alt="SkillSphere Logo"
                className="size-6 rounded-full object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-semibold tracking-tight text-foreground text-[16px]">
                SkillSphere
              </span>
            </Link>

            {/* Desktop Navigation menu */}
            <NavigationMenu className="max-md:hidden">
              <NavigationMenuList className="gap-1 sm:gap-2">
                {(currentUser ? authenticatedLinks : publicLinks).map((link, index) => (
                  <NavigationMenuItem key={index}>
                    <Link
                      to={link.href}
                      className="text-foreground/80 hover:text-foreground hover:border-b-primary border-b-2 border-transparent px-3 py-1.5 font-medium transition-colors text-[13px] whitespace-nowrap no-underline"
                    >
                      {link.label}
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side - User actions & Theme Toggle docked to the right */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notification Bell Dropdown / Popover (Tabular Form) to the left of Theme Icon */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer relative"
                  title="Friend Messages Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[340px] sm:w-[420px] p-0 bg-card border-border shadow-2xl">
                {/* Popover Header */}
                <div className="px-3.5 py-2.5 border-b border-border flex items-center justify-between bg-card">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-[13px] font-semibold text-foreground">Friend Messages</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/15 text-primary tabular-nums">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Tabular Notification Content */}
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No message notifications yet.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/60 text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-secondary/30">
                          <th className="px-3 py-2">Friend</th>
                          <th className="px-3 py-2">Message</th>
                          <th className="px-3 py-2 text-right">Time</th>
                          <th className="px-3 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {notifications.map((notif) => (
                          <tr
                            key={notif.id}
                            onClick={() => handleOpenFriendChat(notif.id, notif.friendId)}
                            className={cn(
                              "hover:bg-secondary/40 transition-colors cursor-pointer group",
                              !notif.isRead ? "bg-primary/5 font-medium" : "text-muted-foreground"
                            )}
                          >
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] text-foreground shrink-0 border border-border">
                                  {notif.friendName.charAt(0)}
                                </div>
                                <span className="font-semibold text-foreground text-xs truncate max-w-[85px]">
                                  {notif.friendName}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 max-w-[140px] truncate">
                              <span className={cn("text-xs truncate block", !notif.isRead ? "text-foreground" : "text-muted-foreground")}>
                                {notif.messageText}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums text-[11px] text-muted-foreground">
                              {notif.timestamp}
                            </td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFriendChat(notif.id, notif.friendId);
                                }}
                                className="px-2 py-0.5 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-[10px] font-semibold transition-all cursor-pointer border border-border group-hover:border-primary/50"
                              >
                                Chat
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Footer Link */}
                <div className="p-2 border-t border-border bg-secondary/10 flex justify-center">
                  <Link
                    to="/friends"
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 no-underline"
                  >
                    <span>Open Friends & Chats</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                  title={`Current theme: ${theme} (${resolvedTheme})`}
                >
                  {resolvedTheme === "dark" ? (
                    <Moon className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 bg-popover border-border text-popover-foreground">
                <DropdownMenuItem
                  className="text-xs cursor-pointer flex items-center justify-between"
                  onClick={() => setTheme("light")}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light</span>
                  </div>
                  {theme === "light" && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs cursor-pointer flex items-center justify-between"
                  onClick={() => setTheme("dark")}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dark</span>
                  </div>
                  {theme === "dark" && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs cursor-pointer flex items-center justify-between"
                  onClick={() => setTheme("system")}
                >
                  <div className="flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>System</span>
                  </div>
                  {theme === "system" && <Check className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {currentUser ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-foreground hover:text-primary"
                  onClick={() => setIsProfileOpen(true)}
                >
                  {fullName || currentUser.displayName || "My Profile"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm border-border text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors font-medium"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-sm">
                  <Link to="/">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="text-sm bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </>
  );
}
