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
      {/* Welcome Bar */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
            Welcome back, {userName}
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Overview of your coursework, meetings, and developer activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate("calendar")}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border-none"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Join Meeting</span>
          </button>
          <button
            onClick={() => onNavigate("media")}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer border-none"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload JPGs</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Google Classroom Card */}
        <div
          onClick={() => onNavigate("classroom")}
          className="p-4 rounded-xl bg-card border border-border hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Classroom</span>
            <div className="text-[20px] font-semibold text-foreground mt-0.5 tabular-nums">
              {pendingAssignments.length} Pending
            </div>
            <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 truncate">
              {pendingAssignments.length > 0 ? pendingAssignments[0].title : "All coursework caught up"}
            </p>
          </div>
        </div>

        {/* Google Calendar Card */}
        <div
          onClick={() => onNavigate("calendar")}
          className="p-4 rounded-xl bg-card border border-border hover:border-blue-500/50 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Calendar</span>
            <div className="text-[20px] font-semibold text-foreground mt-0.5 tabular-nums">
              {todayMeetings.length} Today
            </div>
            <p className="text-[12px] text-blue-600 dark:text-blue-400 font-medium mt-1 truncate">
              {todayMeetings.length > 0 ? todayMeetings[0].title : "No meetings today"}
            </p>
          </div>
        </div>

        {/* To-Do Tasks Card */}
        <div
          onClick={() => onNavigate("todo")}
          className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">To-Do Tasks</span>
            <div className="text-[20px] font-semibold text-foreground mt-0.5 tabular-nums">
              {activeTodos.length} Active
            </div>
            <p className="text-[12px] text-muted-foreground font-medium mt-1 truncate">
              {activeTodos.length > 0 ? activeTodos[0].text : "No pending tasks"}
            </p>
          </div>
        </div>

        {/* Media & Resources Card */}
        <div
          onClick={() => onNavigate("media")}
          className="p-4 rounded-xl bg-card border border-border hover:border-purple-500/50 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Media & Resources</span>
            <div className="text-[20px] font-semibold text-foreground mt-0.5 tabular-nums">
              {mediaFiles.length} Uploads
            </div>
            <p className="text-[12px] text-purple-600 dark:text-purple-400 font-medium mt-1 truncate">
              {mediaFiles.length > 0 ? `${mediaFiles.length} files saved` : "JPG notes & diagrams"}
            </p>
          </div>
        </div>
      </div>

      {/* Developer & Gaming Activity Component */}
      <div className="pt-1">
        <DeveloperActivityCard />
      </div>

      {/* Bottom Two-Column Glance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {/* Next Calendar Events */}
        <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Today's Schedule & Meetings
            </h3>
            <button
              onClick={() => onNavigate("calendar")}
              className="text-[12px] text-primary hover:underline font-semibold cursor-pointer border-none bg-transparent"
            >
              View Calendar
            </button>
          </div>

          <div className="space-y-2">
            {todayMeetings.length === 0 ? (
              <div className="p-6 text-center rounded-lg bg-secondary/20 border border-border text-muted-foreground text-[12px]">
                No meetings scheduled for today.
              </div>
            ) : (
              todayMeetings.slice(0, 2).map((meeting: any) => (
                <div key={meeting.id} className="p-3 rounded-lg bg-secondary/30 border border-border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 tabular-nums">
                      {meeting.startTime} {meeting.endTime ? `- ${meeting.endTime}` : ""}
                    </span>
                    <h4 className="text-[14px] font-semibold text-foreground mt-1.5">
                      {meeting.title}
                    </h4>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{meeting.organizer || "Meeting"}</p>
                  </div>
                  {meeting.meetLink && (
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs shrink-0 no-underline"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Classroom Assignments */}
        <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-500" />
              Pending Google Classroom Tasks
            </h3>
            <button
              onClick={() => onNavigate("classroom")}
              className="text-[12px] text-primary hover:underline font-semibold cursor-pointer border-none bg-transparent"
            >
              View Classroom
            </button>
          </div>

          <div className="space-y-2">
            {pendingAssignments.length === 0 ? (
              <div className="p-6 text-center rounded-lg bg-secondary/20 border border-border text-muted-foreground text-[12px]">
                No pending classroom tasks due.
              </div>
            ) : (
              pendingAssignments.slice(0, 2).map((assign: any) => (
                <div key={assign.id} className="p-3 rounded-lg bg-secondary/30 border border-border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {assign.courseName}
                    </span>
                    <h4 className="text-[14px] font-semibold text-foreground mt-1.5">
                      {assign.title}
                    </h4>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{assign.dueTime || "11:59 PM"} • {assign.points} pts</p>
                  </div>
                  <a
                    href={assign.link || "https://classroom.google.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
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
