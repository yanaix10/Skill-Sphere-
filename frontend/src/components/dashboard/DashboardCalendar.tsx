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
  LogOut,
  ShieldCheck,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  requestGoogleAccess,
  fetchGoogleCalendarEvents,
  disconnectGoogle,
  getGoogleEmail,
  isGoogleConnected,
  CalendarEvent,
} from "../../services/googleAuthService";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  Meeting:   { bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500", text: "text-blue-600 dark:text-blue-400", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30" },
  Duel:      { bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-l-2 border-purple-500", text: "text-purple-600 dark:text-purple-400", badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30" },
  Interview: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-2 border-amber-500", text: "text-amber-600 dark:text-amber-400", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30" },
  Class:     { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-500", text: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" },
  Task:      { bg: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-l-2 border-zinc-500", text: "text-zinc-600 dark:text-zinc-400", badge: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30" },
};

export const DashboardCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_calendar_meetings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return isGoogleConnected('calendar') || localStorage.getItem("skillsphere_calendar_connected") === "true";
  });

  const [calendarEmail, setCalendarEmail] = useState<string>(() => {
    return getGoogleEmail('calendar') || localStorage.getItem("skillsphere_calendar_email") || "";
  });

  const saveEvents = (data: CalendarEvent[]) => {
    setEvents(data);
    try {
      localStorage.setItem("skillsphere_calendar_meetings", JSON.stringify(data));
    } catch {}
  };

  const fetchLiveEvents = useCallback(async () => {
    try {
      setIsSyncing(true);
      const liveEvents = await fetchGoogleCalendarEvents();
      saveEvents(liveEvents);
      setIsConnected(true);
      localStorage.setItem("skillsphere_calendar_connected", "true");
    } catch (err: any) {
      console.warn("Could not fetch Google Calendar events:", err);
      if (err.message && err.message.includes("expired")) {
        setIsConnected(false);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchLiveEvents();
    }
  }, [fetchLiveEvents, isConnected]);

  const handleConnectGoogle = async () => {
    setIsSyncing(true);
    try {
      const { email } = await requestGoogleAccess('calendar');
      if (email) {
        setCalendarEmail(email);
        localStorage.setItem("skillsphere_calendar_email", email);
      }
      setIsConnected(true);
      localStorage.setItem("skillsphere_calendar_connected", "true");
      await fetchLiveEvents();
    } catch (e: any) {
      console.warn("Google Sign-In failed:", e);
      alert(e.message || "Failed to sign in with Google.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogle('calendar');
    setIsConnected(false);
    setCalendarEmail("");
    localStorage.removeItem("skillsphere_calendar_email");
    localStorage.removeItem("skillsphere_calendar_connected");
    saveEvents([]);
  };

  const handleSync = () => {
    fetchLiveEvents();
  };

  const getGoogleCalendarUrl = (ev: CalendarEvent) => {
    const cleanDate = ev.date.replace(/-/g, "");
    const title = encodeURIComponent(ev.title);
    const details = encodeURIComponent(
      `${ev.description || ""}\n\nScheduled via SkillSphere${ev.meetLink ? `\nMeeting Link: ${ev.meetLink}` : ""}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${cleanDate}/${cleanDate}`;
  };

  const exportICalFile = () => {
    if (events.length === 0) return;
    const formatICalDate = (dateStr: string) => dateStr.replace(/-/g, "");
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SkillSphere//Schedule//EN\n";
    events.forEach((ev) => {
      ics += "BEGIN:VEVENT\n";
      ics += `UID:${ev.id}@skillsphere.app\n`;
      ics += `SUMMARY:${ev.title}\n`;
      ics += `DESCRIPTION:${(ev.description || "").replace(/\n/g, "\\n")}${ev.meetLink ? `\\nMeeting: ${ev.meetLink}` : ""}\n`;
      ics += `DTSTART;VALUE=DATE:${formatICalDate(ev.date)}\n`;
      ics += `DTEND;VALUE=DATE:${formatICalDate(ev.date)}\n`;
      ics += "END:VEVENT\n";
    });
    ics += "END:VCALENDAR";

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "skillsphere-calendar.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form State
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    meetLink: "https://meet.google.com/new",
    category: "Meeting" as CalendarEvent["category"],
    description: "",
  });

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
      organizer: user?.displayName || user?.email || "Student",
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
          <div className="w-8 h-8 rounded-md bg-surface-muted border border-border/50 text-muted-foreground flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground m-0">Google Calendar</h2>
          </div>
        </div>

        {/* Toolbar actions show ONLY when connected */}
        {isConnected && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Pill */}
            <div className="px-2.5 py-1.5 rounded-md bg-card border border-border flex items-center gap-2 text-[12px] text-foreground shadow-xs">
              <div className="w-2 h-2 rounded-full shrink-0 bg-emerald-500 ring-2 ring-emerald-500/30" />
              <span className="font-mono text-[11px] text-foreground max-w-[200px] truncate">
                {calendarEmail || "Connected"}
              </span>
            </div>

            {/* Direct Open in Google Calendar Web App */}
            <a
              href="https://calendar.google.com/calendar/r"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-md bg-surface-muted hover:bg-surface-muted/80 text-foreground text-[12px] font-medium flex items-center gap-1.5 transition-colors no-underline border border-border"
              title="Open Google Calendar in new tab"
            >
              <span>Google Calendar</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>

            {/* Export .ics if events exist */}
            {events.length > 0 && (
              <button
                onClick={exportICalFile}
                className="px-2.5 py-1.5 rounded-md bg-surface-muted hover:bg-surface-muted/80 text-foreground text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
                title="Export schedule to .ics file for Google Calendar or Outlook"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Export .ics</span>
              </button>
            )}

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-md bg-surface-muted hover:bg-surface-muted/80 text-foreground text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
              title="Refresh Google Calendar events"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-primary", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>

            {/* Switch Account */}
            <button
              onClick={handleConnectGoogle}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-md bg-surface-muted hover:bg-surface-muted/80 text-foreground text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
              title="Switch to your personal or college Google account"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Switch Account</span>
            </button>

            {/* Prominent Logout Google Button */}
            <button
              onClick={handleDisconnect}
              className="px-2.5 py-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-destructive/20"
              title="Log out from Google Calendar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout Google</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer border-none shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New event</span>
            </button>
          </div>
        )}
      </div>

      {/* Disconnected State Callout */}
      {!isConnected && (
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[15px] font-semibold text-foreground m-0">Connect Google Calendar</h4>
              <p className="text-[12px] text-muted-foreground m-0 max-w-xl">
                Sign in with your personal or college Google account to sync your schedule, lectures, and upcoming meetings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={handleConnectGoogle}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold flex items-center gap-2 cursor-pointer border-none shadow-xs transition-all disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isSyncing ? "Connecting..." : "Sign in with Google"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation & View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
        {/* Month Title & Arrow Controls */}
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold text-foreground m-0 w-44">
            {monthName} {year}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDate("prev")}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer border-none bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer border-none bg-transparent"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate("next")}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer border-none bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-background border border-border text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                view === mode ? "bg-card text-foreground font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground bg-transparent"
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
          <div className="grid grid-cols-7 border-b border-border bg-secondary/30 text-center text-[12px] font-semibold text-muted-foreground">
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
                        isToday ? "w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center" : "text-muted-foreground"
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
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold truncate tabular-nums flex items-center justify-between gap-1 shadow-xs",
                            cat.bg
                          )}
                          title={`${ev.title} (${ev.startTime})`}
                        >
                          <span className="truncate">{ev.title}</span>
                          <span className="opacity-90 shrink-0 text-[9px]">{ev.startTime}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
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
                  <div className="text-[12px] font-semibold text-foreground">
                    {d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" })}
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground pt-2">No events</div>
                    ) : (
                      dayEvents.map((ev) => (
                        <div key={ev.id} className="p-2 rounded-lg bg-card border border-border space-y-1">
                          <div className="text-[11px] font-semibold text-foreground truncate">{ev.title}</div>
                          <div className="text-[10px] font-mono tabular-nums text-muted-foreground">{ev.startTime}</div>
                        </div>
                      ))
                    )}
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
          <h3 className="text-[14px] font-semibold text-foreground">
            {view === "day" ? currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "All Scheduled Events"}
          </h3>
          <div className="space-y-2">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-[12px] text-muted-foreground">
                No events scheduled. Click "New Event" to add a meeting or study session!
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const cat = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.Meeting;
                return (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border", cat.badge)}>
                        {ev.category}
                      </div>
                      <div>
                        <h4 className="text-[14px] font-semibold text-foreground">{ev.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1 font-mono tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {ev.startTime} - {ev.endTime}
                          </span>
                          <span>•</span>
                          <span>{ev.organizer}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {/* Direct Add to Google Calendar Web Intent */}
                      <a
                        href={getGoogleCalendarUrl(ev)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-border bg-card hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Add to Google Calendar"
                      >
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                      </a>

                      {ev.meetLink && (
                        <a
                          href={ev.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs hover:bg-blue-700 transition-colors no-underline"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meet</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-none bg-transparent"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Schedule Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddEvent}
            className="w-full max-w-md rounded-2xl bg-card border border-border p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-[14px] font-semibold text-foreground">Schedule Calendar Event</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-foreground mb-1 block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS Architecture Review"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[12px] font-medium text-foreground mb-1 block">Date</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-foreground mb-1 block">Start</label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-foreground mb-1 block">End</label>
                  <input
                    type="text"
                    placeholder="11:00 AM"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-foreground mb-1 block">Category</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Meeting">Team Meeting</option>
                  <option value="Duel">Coding Duel</option>
                  <option value="Interview">Technical Interview</option>
                  <option value="Class">Class / Lecture</option>
                  <option value="Task">Task / Deadline</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-foreground mb-1 block">Google Meet Link</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/..."
                  value={newEvent.meetLink}
                  onChange={(e) => setNewEvent({ ...newEvent, meetLink: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
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
    </div>
  );
};

export default DashboardCalendar;
