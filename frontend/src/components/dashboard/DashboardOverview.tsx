import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Calendar,
  CheckSquare,
  Image as ImageIcon,
  ArrowRight,
  Video,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DeveloperActivityCard from "./DeveloperActivityCard";

interface DashboardOverviewProps {
  userName: string;
  onNavigate: (section: "media" | "todo" | "jobs" | "classroom" | "calendar" | "activity" | "settings") => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ userName, onNavigate }) => {
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [classroomAssignments, setClassroomAssignments] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);

  useEffect(() => {
    try {
      const cal = localStorage.getItem("skillsphere_calendar_meetings");
      if (cal) setCalendarEvents(JSON.parse(cal));
      const cls = localStorage.getItem("skillsphere_classroom_assignments");
      if (cls) setClassroomAssignments(JSON.parse(cls));
      const td = localStorage.getItem("skillsphere_home_todos");
      if (td) setTodos(JSON.parse(td));
      const mf = localStorage.getItem("skillsphere_uploaded_media");
      if (mf) setMediaFiles(JSON.parse(mf));
    } catch {}
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMeetings = calendarEvents.filter((e) => e.date === todayStr);
  const pendingAssignments = classroomAssignments.filter((a) => !a.submitted);
  const activeTodos = todos.filter((t) => !t.done);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-foreground">
      {/* Welcome Bar — Clean, No Redundant Subtitle */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground m-0">
            Welcome back, {userName}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate("calendar")}
            className="px-3.5 py-1.5 rounded-md border border-border text-foreground hover:bg-surface-muted text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-card shadow-xs"
          >
            <Video className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Join meeting</span>
          </button>
          <button
            onClick={() => onNavigate("media")}
            className="px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-1.5 hover:opacity-95 transition-all shadow-xs cursor-pointer border-none"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload notes</span>
          </button>
        </div>
      </div>

      {/* 4 Quiet Stat Cards — Neutral Gray Icons (Color Reserved For Meaning Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Classroom */}
        <div
          onClick={() => onNavigate("classroom")}
          className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-surface-muted border border-border/50 text-muted-foreground flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <span className="text-[13px] font-medium text-muted-foreground">Classroom tasks</span>
            <div className="text-[28px] font-semibold text-foreground font-mono tabular-nums leading-tight mt-0.5">
              {pendingAssignments.length}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1 truncate">
              {pendingAssignments.length > 0 ? pendingAssignments[0].title : "All coursework caught up"}
            </p>
          </div>
        </div>

        {/* Calendar */}
        <div
          onClick={() => onNavigate("calendar")}
          className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-surface-muted border border-border/50 text-muted-foreground flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <span className="text-[13px] font-medium text-muted-foreground">Today's meetings</span>
            <div className="text-[28px] font-semibold text-foreground font-mono tabular-nums leading-tight mt-0.5">
              {todayMeetings.length}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1 truncate">
              {todayMeetings.length > 0 ? `${todayMeetings[0].title}` : "No events scheduled"}
            </p>
          </div>
        </div>

        {/* To-Do */}
        <div
          onClick={() => onNavigate("todo")}
          className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-surface-muted border border-border/50 text-muted-foreground flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <span className="text-[13px] font-medium text-muted-foreground">Active tasks</span>
            <div className="text-[28px] font-semibold text-foreground font-mono tabular-nums leading-tight mt-0.5">
              {activeTodos.length}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1 truncate">
              {activeTodos.length > 0 ? activeTodos[0].text : "No pending tasks"}
            </p>
          </div>
        </div>

        {/* Media */}
        <div
          onClick={() => onNavigate("media")}
          className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-surface-muted border border-border/50 text-muted-foreground flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-4">
            <span className="text-[13px] font-medium text-muted-foreground">Saved resources</span>
            <div className="text-[28px] font-semibold text-foreground font-mono tabular-nums leading-tight mt-0.5">
              {mediaFiles.length}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1 truncate">
              {mediaFiles.length > 0 ? `${mediaFiles.length} items saved` : "JPG notes & links"}
            </p>
          </div>
        </div>
      </div>

      {/* Centerpiece: Developer Activity Card */}
      <DeveloperActivityCard />

      {/* Lower Glance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Schedule */}
        <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2 m-0">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Today's schedule</span>
            </h3>
            <button
              onClick={() => onNavigate("calendar")}
              className="text-[12px] text-primary hover:underline font-medium cursor-pointer border-none bg-transparent"
            >
              View calendar
            </button>
          </div>

          <div className="space-y-2">
            {todayMeetings.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-[13px]">
                No meetings scheduled for today
              </div>
            ) : (
              todayMeetings.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-md bg-surface-muted/30 border border-border flex items-center justify-between text-[13px]"
                >
                  <div>
                    <div className="font-medium text-foreground">{event.title}</div>
                    <div className="text-[12px] text-muted-foreground font-mono mt-0.5">
                      {event.startTime} – {event.endTime}
                    </div>
                  </div>
                  {event.meetLink && (
                    <a
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[12px] font-medium shrink-0 no-underline"
                    >
                      Join
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Classroom Tasks */}
        <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2 m-0">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <span>Pending assignments</span>
            </h3>
            <button
              onClick={() => onNavigate("classroom")}
              className="text-[12px] text-primary hover:underline font-medium cursor-pointer border-none bg-transparent"
            >
              View classroom
            </button>
          </div>

          <div className="space-y-2">
            {pendingAssignments.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-[13px]">
                No pending classroom tasks
              </div>
            ) : (
              pendingAssignments.slice(0, 3).map((assign) => (
                <div
                  key={assign.id}
                  className="p-3 rounded-md bg-surface-muted/30 border border-border flex items-center justify-between text-[13px]"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-foreground truncate">{assign.title}</div>
                    <div className="text-[12px] text-muted-foreground truncate">{assign.courseName}</div>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-muted-foreground shrink-0">
                    {assign.dueTime || "Due soon"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
