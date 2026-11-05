import React from "react";
import {
  LayoutDashboard,
  Settings,
  Briefcase,
  CheckSquare,
  Image as ImageIcon,
  ChevronRight,
  Calendar,
  GraduationCap,
  TrendingUp,
  PanelLeftClose,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "../firebase";

export type SidebarSection =
  | "overview"
  | "media"
  | "todo"
  | "jobs"
  | "classroom"
  | "calendar"
  | "activity"
  | "settings";

interface HomeSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  activeSection: SidebarSection;
  onSelectSection: (section: SidebarSection) => void;
}

export const HomeSidebar: React.FC<HomeSidebarProps> = ({
  isOpen = true,
  onToggle,
  activeSection,
  onSelectSection,
}) => {
  const user = auth.currentUser;
  const displayName = user?.displayName || "Naitik Yadav";

  if (!isOpen) return null;

  return (
    <aside
      className={cn(
        "w-72 shrink-0 border-r border-border bg-card flex flex-col h-full select-none z-30 transition-all duration-300",
        "shadow-xs text-foreground"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="font-semibold text-xs tracking-wide text-foreground">
            Workspace
          </span>
        </div>

        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Core Sections */}
        <div className="space-y-1">

          {/* Overview */}
          <button
            onClick={() => onSelectSection("overview")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none",
              activeSection === "overview"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-foreground/80 hover:text-foreground hover:bg-secondary bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </div>
            <ChevronRight className={cn("w-3.5 h-3.5 opacity-60", activeSection === "overview" && "opacity-100")} />
          </button>

          {/* Media & Resources (JPGs & Links) */}
          <button
            onClick={() => onSelectSection("media")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none",
              activeSection === "media"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-foreground/80 hover:text-foreground hover:bg-secondary bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span>Media & Resources</span>
            </div>
            <ChevronRight className={cn("w-3.5 h-3.5 opacity-60", activeSection === "media" && "opacity-100")} />
          </button>

          {/* To Do Tasks */}
          <button
            onClick={() => onSelectSection("todo")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none",
              activeSection === "todo"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-foreground/80 hover:text-foreground hover:bg-secondary bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span>To Do Tasks</span>
            </div>
            <ChevronRight className={cn("w-3.5 h-3.5 opacity-60", activeSection === "todo" && "opacity-100")} />
          </button>

          {/* Job Applications */}
          <button
            onClick={() => onSelectSection("jobs")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none",
              activeSection === "jobs"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-foreground/80 hover:text-foreground hover:bg-secondary bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>Job Applications</span>
            </div>
            <ChevronRight className={cn("w-3.5 h-3.5 opacity-60", activeSection === "jobs" && "opacity-100")} />
          </button>

          {/* Profile & Developer Activity (GitHub + Chess.com) */}
          <button
            onClick={() => onSelectSection("activity")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none",
              activeSection === "activity"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-foreground/80 hover:text-foreground hover:bg-secondary bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Profile & Activity</span>
            </div>
            <ChevronRight className={cn("w-3.5 h-3.5 opacity-60", activeSection === "activity" && "opacity-100")} />
          </button>

          {/* Settings */}
          <button
            onClick={() => onSelectSection("settings")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none",
              activeSection === "settings"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-foreground/80 hover:text-foreground hover:bg-secondary bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </div>
            <ChevronRight className={cn("w-3.5 h-3.5 opacity-60", activeSection === "settings" && "opacity-100")} />
          </button>
        </div>

        {/* Live Integrations */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Integrations</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              ACTIVE
            </span>
          </div>

          {/* Google Classroom */}
          <button
            onClick={() => onSelectSection("classroom")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none",
              activeSection === "classroom"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "text-foreground/80 hover:text-foreground hover:bg-emerald-500/10 bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap
                className={cn(
                  "w-4 h-4 shrink-0",
                  activeSection === "classroom" ? "text-white" : "text-emerald-600 dark:text-emerald-400"
                )}
              />
              <span>Google Classroom</span>
            </div>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                activeSection === "classroom" ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              )}
            >
              Sync
            </span>
          </button>

          {/* Google Calendar */}
          <button
            onClick={() => onSelectSection("calendar")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-none",
              activeSection === "calendar"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-foreground/80 hover:text-foreground hover:bg-blue-500/10 bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Calendar
                className={cn(
                  "w-4 h-4 shrink-0",
                  activeSection === "calendar" ? "text-white" : "text-blue-600 dark:text-blue-400"
                )}
              />
              <span>Google Calendar</span>
            </div>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                activeSection === "calendar" ? "bg-white/20 text-white" : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
              )}
            >
              Meet
            </span>
          </button>
        </div>
      </div>

      {/* User Footer Card */}
      <div className="p-3 border-t border-border bg-secondary/20">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
            {displayName.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-foreground truncate">{displayName}</div>
            <div className="text-[10px] text-muted-foreground truncate font-mono">SkillSphere Pro</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default HomeSidebar;
