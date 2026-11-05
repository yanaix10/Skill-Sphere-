import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  RefreshCw,
  ExternalLink,
  MapPin,
  Users,
  CheckCircle2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "../../firebase";

export interface CalendarMeeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "10:30 AM"
  endTime: string; // e.g. "11:30 AM"
  meetLink?: string;
  category: "meeting" | "duel" | "class" | "interview" | "other";
  organizer: string;
  attendees?: string[];
  description?: string;
}

const DEFAULT_MEETINGS: CalendarMeeting[] = [
  {
    id: "meet-1",
    title: "Google Meet: CS Final Project Sprint & Architecture Sync",
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:30 AM",
    endTime: "11:15 AM",
    meetLink: "https://meet.google.com/abc-defg-hij",
    category: "meeting",
    organizer: "Alex Chen (Tech Lead)",
    attendees: ["Naitik Yadav", "Alex Chen", "Sophia Patel"],
    description: "Discuss socket gateway optimization, Judge0 test bench deployment, and state persistence.",
  },
  {
    id: "meet-2",
    title: "SkillSphere 1v1 Algorithmic Duel vs Alex",
    date: new Date().toISOString().slice(0, 10),
    startTime: "6:00 PM",
    endTime: "6:45 PM",
    category: "duel",
    organizer: "SkillSphere Arena",
    attendees: ["Naitik Yadav", "Alex Rivera"],
    description: "Best of 3 dynamic programming speed duel. Winner receives +35 Elo points.",
  },
  {
    id: "meet-3",
    title: "Mock Technical Interview: Distributed Caching & Redis",
    date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    meetLink: "https://meet.google.com/xyz-uvwx-rst",
    category: "interview",
    organizer: "Dr. Evelyn Miller",
    attendees: ["Naitik Yadav", "Dr. Evelyn Miller"],
    description: "System design practice: LRU cache implementation and consistency models.",
  },
  {
    id: "meet-4",
    title: "Discrete Mathematics: Graph Theory Problem Session",
    date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
    startTime: "2:00 PM",
    endTime: "3:30 PM",
    meetLink: "https://meet.google.com/uvw-mnop-qrs",
    category: "class",
    organizer: "Prof. David Clark",
    attendees: ["CS Students Group", "Prof. David Clark"],
    description: "Live walkthrough of Dijkstra and Bellman-Ford proofs.",
  },
];

const CATEGORY_STYLES: Record<CalendarMeeting["category"], { bg: string; text: string; label: string }> = {
  meeting:   { bg: "bg-blue-500/15 border-blue-500/30", text: "text-blue-500", label: "Meeting" },
  duel:      { bg: "bg-purple-500/15 border-purple-500/30", text: "text-purple-500", label: "Duel" },
  interview: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-500", label: "Interview" },
  class:     { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-500", label: "Class" },
  other:     { bg: "bg-secondary border-border", text: "text-muted-foreground", label: "Event" },
};

export const DashboardCalendar: React.FC = () => {
  const [meetings, setMeetings] = useState<CalendarMeeting[]>(DEFAULT_MEETINGS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Calendar month navigation
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // New Event Form State
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "11:00 AM",
    endTime: "12:00 PM",
    meetLink: "https://meet.google.com/new",
    category: "meeting" as CalendarMeeting["category"],
    description: "",
  });

  const user = auth.currentUser;
  const userEmail = user?.email || "naitik.yadav@university.edu";

  useEffect(() => {
    try {
      const stored = localStorage.getItem("skillsphere_calendar_meetings");
      if (stored) {
        setMeetings(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const saveMeetings = (data: CalendarMeeting[]) => {
    setMeetings(data);
    try {
      localStorage.setItem("skillsphere_calendar_meetings", JSON.stringify(data));
    } catch (e) {}
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title.trim()) return;

    const item: CalendarMeeting = {
      id: `meet-${Date.now()}`,
      title: newMeeting.title.trim(),
      date: newMeeting.date,
      startTime: newMeeting.startTime,
      endTime: newMeeting.endTime,
      meetLink: newMeeting.meetLink.trim() || undefined,
      category: newMeeting.category,
      organizer: user?.displayName || "Naitik Yadav",
      description: newMeeting.description.trim() || undefined,
    };

    saveMeetings([item, ...meetings]);
    setShowAddModal(false);
    setNewMeeting({
      title: "",
      date: new Date().toISOString().slice(0, 10),
      startTime: "11:00 AM",
      endTime: "12:00 PM",
      meetLink: "https://meet.google.com/new",
      category: "meeting",
      description: "",
    });
  };

  const handleDeleteMeeting = (id: string) => {
    saveMeetings(meetings.filter((m) => m.id !== id));
  };

  // Build calendar month days
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonthDate.toLocaleString("default", { month: "long" });

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  // Filter meetings by selected date or show all upcoming
  const todayStr = new Date().toISOString().slice(0, 10);
  const meetingsForSelected = meetings.filter((m) => m.date === selectedDate);
  const upcomingMeetings = [...meetings].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-foreground">
      {/* Google Calendar Official Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Google Calendar
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold tracking-normal border border-blue-500/30">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                View upcoming project meetings, 1v1 coding duels, quiz battles, and study groups
              </p>
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:inline font-mono">{userEmail}</span>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-blue-500", isSyncing && "animate-spin")} />
            <span>{isSyncing ? "Syncing..." : "Sync Calendar"}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Month Calendar View (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            {/* Month Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">
                {monthName} {year}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer border-none bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    setCurrentMonthDate(now);
                    setSelectedDate(now.toISOString().slice(0, 10));
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer border-none bg-transparent"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer border-none bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="py-2 text-muted-foreground/30 select-none">
                  -
                </div>
              ))}

              {/* Month dates */}
              {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const hasEvents = meetings.some((m) => m.date === dateStr);

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-semibold relative transition-all cursor-pointer border-none flex flex-col items-center justify-center",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : isToday
                        ? "bg-secondary text-primary font-bold border border-primary/40"
                        : "hover:bg-secondary text-foreground bg-transparent"
                    )}
                  >
                    <span>{dayNum}</span>
                    {hasEvents && (
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full mt-0.5",
                          isSelected ? "bg-white" : "bg-blue-500"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Date Indicator */}
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Selected Date:</span>
            <span className="font-bold text-foreground">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Right Column: Upcoming Schedule & Meetings List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Upcoming Meetings & Sessions ({upcomingMeetings.length})
            </h3>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Open Google Calendar</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3">
            {upcomingMeetings.map((meet) => {
              const style = CATEGORY_STYLES[meet.category] || CATEGORY_STYLES.other;
              const isSelectedDay = meet.date === selectedDate;

              return (
                <div
                  key={meet.id}
                  className={cn(
                    "p-4 rounded-2xl bg-card border transition-all space-y-3 shadow-xs",
                    isSelectedDay ? "border-primary ring-1 ring-primary/40" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border", style.bg, style.text)}>
                          {style.label}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground font-bold">
                          {meet.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{meet.title}</h4>
                      {meet.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{meet.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      {meet.meetLink && (
                        <a
                          href={meet.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs no-underline"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meet</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteMeeting(meet.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                        title="Delete meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{meet.startTime} - {meet.endTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{meet.organizer}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddMeeting}
            className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                Schedule Meeting or Event
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Design Mock Interview"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Date</label>
                  <input
                    type="date"
                    required
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM"
                    value={newMeeting.startTime}
                    onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">End Time</label>
                  <input
                    type="text"
                    required
                    placeholder="11:00 AM"
                    value={newMeeting.endTime}
                    onChange={(e) => setNewMeeting({ ...newMeeting, endTime: e.target.value })}
                    className="w-full px-2 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Category</label>
                  <select
                    value={newMeeting.category}
                    onChange={(e) => setNewMeeting({ ...newMeeting, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="meeting">Team Meeting</option>
                    <option value="interview">Mock Interview</option>
                    <option value="duel">Coding Duel</option>
                    <option value="class">Class / Lecture</option>
                    <option value="other">General Event</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Google Meet / Video Link</label>
                  <input
                    type="text"
                    placeholder="https://meet.google.com/..."
                    value={newMeeting.meetLink}
                    onChange={(e) => setNewMeeting({ ...newMeeting, meetLink: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Description</label>
                <textarea
                  rows={2}
                  placeholder="Meeting agenda, topics, or notes..."
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-xs cursor-pointer border-none"
              >
                Schedule Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardCalendar;

