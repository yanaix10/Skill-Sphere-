import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  RefreshCw,
  ExternalLink,
  Users,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Grid3x3,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "../../firebase";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "10:30 AM"
  endTime: string; // e.g. "11:15 AM"
  meetLink?: string;
  category: "Meeting" | "Duel" | "Class" | "Interview" | "Task";
  organizer: string;
  description?: string;
  color?: string;
}

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: "meet-1",
    title: "Google Meet: CS Final Project Sprint & Architecture Sync",
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:30 AM",
    endTime: "11:15 AM",
    meetLink: "https://meet.google.com/abc-defg-hij",
    category: "Meeting",
    organizer: "Alex Chen (Tech Lead)",
    description: "Discuss socket gateway optimization and test bench verification.",
    color: "blue",
  },
  {
    id: "meet-2",
    title: "SkillSphere 1v1 Algorithmic Duel vs Alex",
    date: new Date().toISOString().slice(0, 10),
    startTime: "06:00 PM",
    endTime: "06:45 PM",
    category: "Duel",
    organizer: "SkillSphere Arena",
    description: "Best of 3 dynamic programming speed duel. Winner receives +35 Elo.",
    color: "purple",
  },
  {
    id: "meet-3",
    title: "Mock Technical Interview: Distributed Caching & Redis",
    date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    startTime: "04:00 PM",
    endTime: "05:00 PM",
    meetLink: "https://meet.google.com/xyz-uvwx-rst",
    category: "Interview",
    organizer: "Dr. Evelyn Miller",
    description: "System design practice: LRU cache implementation and consistency models.",
    color: "orange",
  },
  {
    id: "meet-4",
    title: "Discrete Mathematics: Graph Theory Problem Session",
    date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
    startTime: "02:00 PM",
    endTime: "03:30 PM",
    meetLink: "https://meet.google.com/uvw-mnop-qrs",
    category: "Class",
    organizer: "Prof. David Clark",
    description: "Live walkthrough of Dijkstra and Bellman-Ford proofs.",
    color: "green",
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  Meeting:   { bg: "bg-blue-500", text: "text-blue-400", badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  Duel:      { bg: "bg-purple-500", text: "text-purple-400", badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  Interview: { bg: "bg-orange-500", text: "text-orange-400", badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  Class:     { bg: "bg-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  Task:      { bg: "bg-zinc-500", text: "text-zinc-400", badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

export const DashboardCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_calendar_meetings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_EVENTS;
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    meetLink: "https://meet.google.com/new",
    category: "Meeting" as CalendarEvent["category"],
    description: "",
  });

  const user = auth.currentUser;
  const personalEmail = user?.email || "naitik.yadav641@gmail.com";

  const [calendarEmail, setCalendarEmail] = useState<string>(() => {
    return localStorage.getItem("skillsphere_calendar_email") || "";
  });
  const [isCollegeAccount, setIsCollegeAccount] = useState<boolean>(() => {
    return localStorage.getItem("skillsphere_calendar_is_college") === "true";
  });
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [collegeEmailInput, setCollegeEmailInput] = useState<string>(
    localStorage.getItem("skillsphere_calendar_email") || "naitik.yadav@vitstudent.ac.in"
  );

  const effectiveEmail = calendarEmail || personalEmail;

  const handleSaveCollegeEmail = () => {
    if (!collegeEmailInput.trim()) return;
    const clean = collegeEmailInput.trim().toLowerCase();
    setCalendarEmail(clean);
    setIsCollegeAccount(true);
    localStorage.setItem("skillsphere_calendar_email", clean);
    localStorage.setItem("skillsphere_calendar_is_college", "true");
    setShowAccountModal(false);
    handleSync();
  };

  const handleUsePersonalEmail = () => {
    setCalendarEmail(personalEmail);
    setIsCollegeAccount(false);
    localStorage.setItem("skillsphere_calendar_email", personalEmail);
    localStorage.setItem("skillsphere_calendar_is_college", "false");
    setShowAccountModal(false);
    handleSync();
  };

  const saveEvents = (data: CalendarEvent[]) => {
    setEvents(data);
    try {
      localStorage.setItem("skillsphere_calendar_meetings", JSON.stringify(data));
    } catch {}
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const item: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title.trim(),
      date: newEvent.date,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      meetLink: newEvent.meetLink.trim() || undefined,
      category: newEvent.category,
      organizer: user?.displayName || "Naitik Yadav",
      description: newEvent.description.trim() || undefined,
      color: newEvent.category === "Meeting" ? "blue" : newEvent.category === "Duel" ? "purple" : "green",
    };

    saveEvents([item, ...events]);
    setShowAddModal(false);
    setNewEvent({
      title: "",
      date: new Date().toISOString().slice(0, 10),
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      meetLink: "https://meet.google.com/new",
      category: "Meeting",
      description: "",
    });
  };

  const handleDeleteEvent = (id: string) => {
    saveEvents(events.filter((e) => e.id !== id));
  };

  // Date Navigation
  const navigateDate = (dir: "prev" | "next") => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === "month") next.setMonth(prev.getMonth() + (dir === "next" ? 1 : -1));
      else if (view === "week") next.setDate(prev.getDate() + (dir === "next" ? 7 : -7));
      else if (view === "day") next.setDate(prev.getDate() + (dir === "next" ? 1 : -1));
      return next;
    });
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-white m-0">Google Calendar</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Account Switcher Pill */}
          <button
            onClick={() => setShowAccountModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-secondary/70 border border-border flex items-center gap-2 text-[12px] text-foreground transition-all cursor-pointer shadow-xs"
            title="Switch between Personal and College Google Account"
          >
            <div className={cn("w-2 h-2 rounded-full shrink-0", isCollegeAccount ? "bg-emerald-400 ring-2 ring-emerald-500/30" : "bg-blue-400")} />
            <span className="font-mono text-[11px] text-[#E2E8F0] max-w-[180px] sm:max-w-[220px] truncate">
              {effectiveEmail}
            </span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider pl-1 border-l border-border/80">
              {isCollegeAccount ? "College" : "Personal"}
            </span>
          </button>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-blue-400", isSyncing && "animate-spin")} />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Navigation & View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
        {/* Month Title & Arrow Controls */}
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold text-[#E2E8F0] m-0 w-44">
            {monthName} {year}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDate("prev")}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-secondary cursor-pointer border-none bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-[#94A3B8] hover:text-white hover:bg-secondary cursor-pointer border-none bg-transparent"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate("next")}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-secondary cursor-pointer border-none bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-background border border-border text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary border border-border">
          {(["month", "week", "day", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={cn(
                "px-3 py-1 rounded-lg text-[12px] font-medium transition-all cursor-pointer border-none capitalize",
                view === mode ? "bg-card text-white font-semibold shadow-xs" : "text-[#94A3B8] hover:text-white bg-transparent"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CALENDAR VIEWS ─── */}
      {view === "month" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-border bg-secondary/30 text-center text-[12px] font-semibold text-[#94A3B8]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 border-r border-border last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }).map((_, idx) => {
              const dayNum = idx - firstDayOfMonth + 1;
              const isCurrentMonth = dayNum > 0 && dayNum <= totalDaysInMonth;
              const cellDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.max(1, dayNum)).padStart(2, "0")}`;
              const isToday = isCurrentMonth && cellDate === todayStr;
              const dayEvents = isCurrentMonth ? filteredEvents.filter((e) => e.date === cellDate) : [];

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[96px] p-2 border-b border-r border-border transition-colors last:border-r-0 flex flex-col justify-between",
                    !isCurrentMonth ? "bg-muted/10 opacity-30" : "hover:bg-secondary/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[12px] font-mono tabular-nums",
                        isToday ? "w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center" : "text-[#94A3B8]"
                      )}
                    >
                      {isCurrentMonth ? dayNum : ""}
                    </span>
                  </div>

                  <div className="space-y-1 mt-1 flex-1">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const cat = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.Meeting;
                      return (
                        <div
                          key={ev.id}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold text-white truncate tabular-nums flex items-center justify-between gap-1",
                            cat.bg
                          )}
                          title={`${ev.title} (${ev.startTime})`}
                        >
                          <span className="truncate">{ev.title}</span>
                          <span className="opacity-80 shrink-0 text-[9px]">{ev.startTime}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] font-mono tabular-nums text-[#94A3B8]">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(currentDate);
              d.setDate(currentDate.getDate() - currentDate.getDay() + i);
              const dStr = d.toISOString().slice(0, 10);
              const dayEvents = filteredEvents.filter((e) => e.date === dStr);

              return (
                <div key={i} className="rounded-xl border border-border bg-secondary/20 p-3 min-h-[160px] space-y-2">
                  <div className="text-[12px] font-semibold text-white">
                    {d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" })}
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.map((ev) => (
                      <div key={ev.id} className="p-2 rounded-lg bg-card border border-border space-y-1">
                        <div className="text-[11px] font-semibold text-[#E2E8F0] truncate">{ev.title}</div>
                        <div className="text-[10px] font-mono tabular-nums text-[#94A3B8]">{ev.startTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day / List View */}
      {(view === "day" || view === "list") && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-[14px] font-semibold text-[#E2E8F0]">
            {view === "day" ? currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "All Scheduled Events"}
          </h3>
          <div className="space-y-2">
            {filteredEvents.map((ev) => {
              const cat = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.Meeting;
              return (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl border border-border bg-secondary/20 hover:border-primary/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border", cat.badge)}>
                        {ev.category}
                      </span>
                      <span className="text-[12px] font-mono tabular-nums text-[#94A3B8]">{ev.date}</span>
                    </div>
                    <h4 className="text-[13px] font-semibold text-white truncate">{ev.title}</h4>
                    {ev.description && <p className="text-[12px] text-[#94A3B8] line-clamp-1">{ev.description}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ev.meetLink && (
                      <a
                        href={ev.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[12px] font-bold flex items-center gap-1.5 no-underline hover:bg-blue-700 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="p-1.5 text-[#94A3B8] hover:text-destructive cursor-pointer border-none bg-transparent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddEvent}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-5 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Schedule Calendar Event
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#94A3B8] hover:text-white cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-[#E2E8F0] mb-1 block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algorithmic Duel / Review"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[12px] font-medium text-[#E2E8F0] mb-1 block">Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#E2E8F0] mb-1 block">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#E2E8F0] mb-1 block">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="11:00 AM"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#E2E8F0] mb-1 block">Category</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Meeting">Team Meeting</option>
                  <option value="Duel">Coding Duel</option>
                  <option value="Interview">Technical Interview</option>
                  <option value="Class">Class / Lecture</option>
                  <option value="Task">Task / Deadline</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#E2E8F0] mb-1 block">Google Meet Link</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/..."
                  value={newEvent.meetLink}
                  onChange={(e) => setNewEvent({ ...newEvent, meetLink: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-[12px] text-[#94A3B8] hover:text-white cursor-pointer border-none bg-transparent"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer border-none"
              >
                Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Switch / Link College Google Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <h3 className="text-[14px] font-semibold text-white">
                  Link College / University Google Calendar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-secondary cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-[#94A3B8]">
              Link your college / institutional Google Calendar account to pull classes, exams, lab schedules, and meetings into SkillSphere.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                  College Institutional Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. naitik.yadav@vitstudent.ac.in"
                  value={collegeEmailInput}
                  onChange={(e) => setCollegeEmailInput(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border text-[12px] space-y-1">
                <div className="text-[#94A3B8]">Currently Active Calendar Account:</div>
                <div className="font-mono text-white text-[12px] font-medium break-all">
                  {effectiveEmail} {isCollegeAccount && <span className="text-blue-400 font-semibold">(College Linked)</span>}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveCollegeEmail}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer border-none transition-colors"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Save & Connect College Calendar</span>
              </button>

              {user?.email && isCollegeAccount && (
                <button
                  type="button"
                  onClick={handleUsePersonalEmail}
                  className="w-full py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-[#E2E8F0] text-[12px] font-semibold cursor-pointer border border-border transition-colors"
                >
                  Switch back to Personal Account ({personalEmail})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCalendar;
