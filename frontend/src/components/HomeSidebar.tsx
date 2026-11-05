import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Settings,
  Briefcase,
  CheckSquare,
  Image as ImageIcon,
  Calendar,
  GraduationCap,
  TrendingUp,
  PanelLeftClose,
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

  const [isClassroomConnected, setIsClassroomConnected] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  useEffect(() => {
    const checkConnections = () => {
      setIsClassroomConnected(
        localStorage.getItem("skillsphere_classroom_connected") === "true"
      );
      setIsCalendarConnected(
        localStorage.getItem("skillsphere_calendar_connected") === "true"
      );
    };
    checkConnections();
    window.addEventListener("storage", checkConnections);
    return () => window.removeEventListener("storage", checkConnections);
  }, []);

  if (!isOpen) return null;

  const coreSections: { id: SidebarSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "media", label: "Media & resources", icon: ImageIcon },
    { id: "todo", label: "To-do tasks", icon: CheckSquare },
    { id: "jobs", label: "Job applications", icon: Briefcase },
    { id: "activity", label: "Profile & activity", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "w-64 shrink-0 border-r border-border bg-card flex flex-col h-full select-none z-30 transition-all duration-200",
        "text-foreground"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-surface-muted border border-border/60 text-foreground flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-[14px] text-foreground tracking-tight">
            SkillSphere
          </span>
        </div>

        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer border-none bg-transparent"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Core Sections */}
        <div className="space-y-0.5">
          {coreSections.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => onSelectSection(id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all cursor-pointer border-none text-left",
                  isActive
                    ? "bg-surface-muted text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-muted/60 bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Integrations Section */}
        <div className="space-y-1 pt-2 border-t border-border/50">
          <div className="px-3 py-1 text-[12px] font-medium text-muted-foreground">
            Integrations
          </div>

          {/* Google Classroom */}
          <button
            onClick={() => onSelectSection("classroom")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all cursor-pointer border-none text-left",
              activeSection === "classroom"
                ? "bg-surface-muted text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-muted/60 bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GraduationCap
                className={cn(
                  "w-4 h-4 shrink-0",
                  activeSection === "classroom" ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="truncate">Google Classroom</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground font-normal">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isClassroomConnected ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
                )}
              />
              <span className="hidden sm:inline">
                {isClassroomConnected ? "Connected" : "Not connected"}
              </span>
            </div>
          </button>

          {/* Google Calendar */}
          <button
            onClick={() => onSelectSection("calendar")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all cursor-pointer border-none text-left",
              activeSection === "calendar"
                ? "bg-surface-muted text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-muted/60 bg-transparent"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Calendar
                className={cn(
                  "w-4 h-4 shrink-0",
                  activeSection === "calendar" ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="truncate">Google Calendar</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground font-normal">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isCalendarConnected ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
                )}
              />
              <span className="hidden sm:inline">
                {isCalendarConnected ? "Connected" : "Not connected"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-border bg-surface-muted/30">
        <div className="flex items-center gap-2.5 p-2 rounded-md bg-card border border-border">
          <div className="w-7 h-7 rounded-md bg-surface-muted border border-border text-foreground flex items-center justify-center font-semibold text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-foreground truncate">{displayName}</div>
            <div className="text-[11px] text-muted-foreground truncate">SkillSphere Pro</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default HomeSidebar;
