import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Clock,
  ExternalLink,
  RefreshCw,
  Plus,
  BookOpen,
  UserCheck,
  Check,
  X,
  LogOut,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, googleProvider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";
import { BACKEND_URL } from "../../utils/api";

export interface ClassroomCourse {
  id: string;
  name: string;
  section: string;
  teacher: string;
  roomCode: string;
  link: string;
}

export interface ClassroomAssignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  submitted: boolean;
  points: number;
  link?: string;
}

export const DashboardClassroom: React.FC = () => {
  const [courses, setCourses] = useState<ClassroomCourse[]>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_classroom_courses");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [assignments, setAssignments] = useState<ClassroomAssignment[]>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_classroom_assignments");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return localStorage.getItem("skillsphere_classroom_connected") === "true";
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [filter, setFilter] = useState<"pending" | "submitted" | "all">("pending");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);

  const user = auth.currentUser;
  const [classroomEmail, setClassroomEmail] = useState<string>(() => {
    return localStorage.getItem("skillsphere_classroom_email") || "";
  });
  const [isCollegeAccount, setIsCollegeAccount] = useState<boolean>(() => {
    return localStorage.getItem("skillsphere_classroom_is_college") === "true";
  });
  const [collegeEmailInput, setCollegeEmailInput] = useState<string>("");

  const effectiveEmail = classroomEmail || user?.email || "";

  const saveAssignments = (data: ClassroomAssignment[]) => {
    setAssignments(data);
    try {
      localStorage.setItem("skillsphere_classroom_assignments", JSON.stringify(data));
    } catch {}
  };

  const saveCourses = (data: ClassroomCourse[]) => {
    setCourses(data);
    try {
      localStorage.setItem("skillsphere_classroom_courses", JSON.stringify(data));
    } catch {}
  };

  const getUserId = () => {
    return auth.currentUser?.uid || localStorage.getItem("skillsphere_current_user_id") || "default_user";
  };

  const fetchLiveClassroom = async () => {
    const userId = getUserId();
    try {
      setIsSyncing(true);
      const res = await fetch(`${BACKEND_URL}/api/google/classroom/assignments?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.courses) && data.courses.length > 0) {
          saveCourses(data.courses);
        }
        if (Array.isArray(data.assignments) && data.assignments.length > 0) {
          saveAssignments(data.assignments);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Google Classroom data:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_sync") === "success") {
      const email = params.get("email");
      if (email) {
        setClassroomEmail(email);
        localStorage.setItem("skillsphere_classroom_email", email);
      }
      setIsConnected(true);
      localStorage.setItem("skillsphere_classroom_connected", "true");
      fetchLiveClassroom();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isConnected) {
      fetchLiveClassroom();
    }
  }, [isConnected]);

  // Real Google Sign-In with OAuth Popup & Permissions Consent
  const handleConnectGoogle = async () => {
    setIsSyncing(true);
    const userId = getUserId();
    try {
      const res = await fetch(`${BACKEND_URL}/api/google/auth-url?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err: any) {
      console.warn("Google Sign-In:", err);
      setShowAccountModal(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    const userId = getUserId();
    try {
      await fetch(`${BACKEND_URL}/api/google/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {}
    setIsConnected(false);
    setClassroomEmail("");
    localStorage.removeItem("skillsphere_classroom_connected");
    localStorage.removeItem("skillsphere_classroom_email");
    localStorage.removeItem("skillsphere_classroom_is_college");
    saveCourses([]);
    saveAssignments([]);
  };

  const handleSaveCollegeEmail = () => {
    if (!collegeEmailInput.trim()) return;
    const clean = collegeEmailInput.trim().toLowerCase();
    setClassroomEmail(clean);
    setIsConnected(true);
    setIsCollegeAccount(true);
    localStorage.setItem("skillsphere_classroom_email", clean);
    localStorage.setItem("skillsphere_classroom_connected", "true");
    localStorage.setItem("skillsphere_classroom_is_college", "true");
    setShowAccountModal(false);
    handleSync();
  };

  const handleSync = () => {
    fetchLiveClassroom();
  };

  // Form state for adding custom assignment
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    courseName: "General Coursework",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    dueTime: "11:59 PM",
    points: 50,
    description: "",
  });

  const handleToggleSubmit = (id: string) => {
    const updated = assignments.map((a) => (a.id === id ? { ...a, submitted: !a.submitted } : a));
    saveAssignments(updated);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title.trim()) return;

    const item: ClassroomAssignment = {
      id: `assign-${Date.now()}`,
      courseId: "custom",
      courseName: newAssignment.courseName,
      title: newAssignment.title.trim(),
      description: newAssignment.description,
      dueDate: new Date(newAssignment.dueDate).toISOString(),
      dueTime: newAssignment.dueTime,
      submitted: false,
      points: Number(newAssignment.points) || 50,
      link: "https://classroom.google.com",
    };

    saveAssignments([item, ...assignments]);
    setShowAddModal(false);
    setNewAssignment({
      title: "",
      courseName: courses.length > 0 ? courses[0].name : "General Coursework",
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      dueTime: "11:59 PM",
      points: 50,
      description: "",
    });
  };

  const getRelativeDue = (isoDate: string) => {
    const due = new Date(isoDate).getTime();
    const now = Date.now();
    const diffHours = Math.round((due - now) / (1000 * 60 * 60));

    if (diffHours < 0) return "Past due";
    if (diffHours <= 24) return `Due Tomorrow`;
    const diffDays = Math.round(diffHours / 24);
    return `Due in ${diffDays} days`;
  };

  const pendingList = assignments.filter((a) => !a.submitted);
  const submittedList = assignments.filter((a) => a.submitted);
  const displayList =
    filter === "pending" ? pendingList : filter === "submitted" ? submittedList : assignments;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-foreground">
      {/* Google Classroom Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-surface-muted border border-border/50 text-muted-foreground flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground m-0">
              Google Classroom
            </h2>
          </div>
        </div>

        {/* Toolbar actions show ONLY when connected */}
        {isConnected && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Switcher Pill */}
            <button
              onClick={() => setShowAccountModal(true)}
              className="px-2.5 py-1.5 rounded-md bg-card hover:bg-surface-muted border border-border flex items-center gap-2 text-[12px] text-foreground transition-all cursor-pointer shadow-xs"
              title="Switch between Personal and College Google account"
            >
              <div className={cn("w-2 h-2 rounded-full shrink-0", isCollegeAccount ? "bg-emerald-500 ring-2 ring-emerald-500/30" : "bg-primary")} />
              <span className="font-mono text-[11px] text-foreground max-w-[180px] sm:max-w-[220px] truncate">
                {effectiveEmail}
              </span>
              <span className="text-[10px] text-primary font-medium pl-1 border-l border-border/80">
                {isCollegeAccount ? "College" : "Personal"}
              </span>
            </button>

            {/* Direct Open in Google Classroom */}
            <a
              href="https://classroom.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-md bg-surface-muted hover:bg-surface-muted/80 text-foreground text-[12px] font-medium flex items-center gap-1.5 transition-colors no-underline border border-border"
              title="Open Google Classroom portal in new tab"
            >
              <span>Google Classroom</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>

            {/* Direct Open Classroom Calendar */}
            <a
              href="https://calendar.google.com/calendar/u/0/r?tab=mc"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-md bg-surface-muted hover:bg-surface-muted/80 text-foreground text-[12px] font-medium flex items-center gap-1.5 transition-colors no-underline border border-border"
              title="Open Google Classroom Calendar in new tab"
            >
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Calendar</span>
            </a>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-md bg-surface-muted hover:bg-surface-muted/80 text-foreground text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
              title="Refresh Google Classroom sync"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-primary", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>

            <button
              onClick={handleDisconnect}
              className="p-1.5 rounded-md bg-surface-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer border border-border"
              title="Disconnect Google Classroom"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] font-medium flex items-center gap-1.5 hover:opacity-95 transition-all shadow-xs cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add task</span>
            </button>
          </div>
        )}
      </div>

      {/* When Account Is NOT Connected: Clean Connect Callout */}
      {!isConnected ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-card border border-border flex flex-col items-center justify-center max-w-xl mx-auto my-8 space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-[18px] font-semibold text-foreground m-0">Connect Google Classroom</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <ShieldCheck className="w-3 h-3" />
                Verified Safe Sign-In
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground max-w-md mt-1">
              Sign in with your personal or college Google Workspace account (@vitstudent.ac.in, .edu). Safe identity authentication without sensitive data or admin barriers.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <button
              onClick={handleConnectGoogle}
              disabled={isSyncing}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold flex items-center gap-2 cursor-pointer shadow-xs border-none transition-all disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isSyncing ? "Connecting..." : "Sign in with Google"}</span>
            </button>
            <button
              onClick={() => setShowAccountModal(true)}
              className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-[12px] font-semibold cursor-pointer border border-border"
            >
              Enter College Email Manually
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Enrolled Courses or Launch Portal */}
          {courses.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Enrolled Google Classroom Courses ({courses.length})
                </h3>
                <a
                  href="https://classroom.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Google Classroom</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {courses.map((course) => (
                  <a
                    key={course.id}
                    href={course.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl bg-card border border-border hover:border-emerald-500/50 transition-all flex flex-col justify-between group no-underline shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                          {course.section}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <h4 className="text-[14px] font-semibold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-2">
                        {course.name}
                      </h4>
                    </div>
                    <div className="pt-2.5 mt-2.5 border-t border-border/60 text-[12px] text-muted-foreground flex items-center justify-between">
                      <span className="truncate">{course.teacher}</span>
                      <span className="font-mono text-[10px] text-muted-foreground/80">{course.roomCode}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-foreground m-0">Open Enrolled Courses</h4>
                  <p className="text-[12px] text-muted-foreground m-0">
                    Access assignments, stream materials, and lecture notes directly inside Google Classroom.
                  </p>
                </div>
              </div>
              <a
                href="https://classroom.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors no-underline shrink-0"
              >
                <span>Launch Google Classroom</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Filter Tabs for Assignments */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setFilter("pending")}
              className={cn(
                "px-3 py-1 rounded-lg text-[12px] font-semibold transition-all cursor-pointer border",
                filter === "pending"
                  ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border"
              )}
            >
              Pending Assignments ({pendingList.length})
            </button>
            <button
              onClick={() => setFilter("submitted")}
              className={cn(
                "px-3 py-1 rounded-lg text-[12px] font-semibold transition-all cursor-pointer border",
                filter === "submitted"
                  ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border"
              )}
            >
              Turned In ({submittedList.length})
            </button>
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-3 py-1 rounded-lg text-[12px] font-semibold transition-all cursor-pointer border",
                filter === "all"
                  ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border"
              )}
            >
              All Tasks ({assignments.length})
            </button>
          </div>

          {/* Assignments List */}
          <div className="space-y-2.5">
            {displayList.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-card border border-border text-muted-foreground">
                <p className="text-[14px] font-semibold text-foreground">No coursework found</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  You have no pending assignments on this account. Click "Add Task" to track a personal task!
                </p>
              </div>
            ) : (
              displayList.map((assign) => (
                <div
                  key={assign.id}
                  className={cn(
                    "p-3.5 rounded-xl bg-card border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs",
                    assign.submitted ? "border-border/60 opacity-75" : "border-border hover:border-emerald-500/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleSubmit(assign.id)}
                      className={cn(
                        "mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0",
                        assign.submitted
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-border hover:border-emerald-500 bg-background"
                      )}
                      title={assign.submitted ? "Mark as pending" : "Mark as turned in"}
                    >
                      {assign.submitted && <Check className="w-3 h-3" />}
                    </button>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-primary">
                          {assign.courseName}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-muted-foreground tabular-nums">
                          {assign.points} pts
                        </span>
                      </div>

                      <h4
                        className={cn(
                          "text-[14px] font-semibold text-foreground",
                          assign.submitted && "line-through text-muted-foreground"
                        )}
                      >
                        {assign.title}
                      </h4>

                      {assign.description && (
                        <p className="text-[12px] text-muted-foreground line-clamp-2 max-w-2xl">{assign.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground justify-end tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{assign.dueTime || "11:59 PM"}</span>
                      </div>
                      <div className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                        {getRelativeDue(assign.dueDate)}
                      </div>
                    </div>

                    <a
                      href={assign.link || "https://classroom.google.com"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border"
                      title="Open Assignment in Google Classroom"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Add Custom Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAssignment}
            className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                Add Classroom Assignment / Task
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Problem Set 5: Graph Theory"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Course</label>
                <input
                  type="text"
                  required
                  placeholder="Course name (e.g. CS-301: Algorithms)"
                  value={newAssignment.courseName}
                  onChange={(e) => setNewAssignment({ ...newAssignment, courseName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Due Time</label>
                  <input
                    type="text"
                    placeholder="11:59 PM"
                    value={newAssignment.dueTime}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueTime: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Notes, problem numbers, or submission requirements..."
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
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
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer border-none"
              >
                Add Assignment
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
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <h3 className="text-[14px] font-semibold text-foreground">
                  Link College / University Google Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>
                Standard Google OAuth: 100% safe for institutional (@vitstudent.ac.in, .edu) and personal Gmail accounts without administrator restrictions.
              </span>
            </div>

            <p className="text-[12px] text-muted-foreground">
              Sign in with your university Google Workspace ID or enter your institutional email to access your courses, syllabi, and assignment deadlines.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  College Institutional Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. naitik.yadav@vitstudent.ac.in"
                  value={collegeEmailInput}
                  onChange={(e) => setCollegeEmailInput(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              {effectiveEmail && (
                <div className="p-3 rounded-lg bg-secondary/30 border border-border text-[12px] space-y-1">
                  <div className="text-muted-foreground">Active Classroom Account:</div>
                  <div className="font-mono text-foreground text-[12px] font-medium break-all">
                    {effectiveEmail} {isCollegeAccount && <span className="text-emerald-500 font-semibold">(College Linked)</span>}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConnectGoogle}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer border-none transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Authorize with Google OAuth</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCollegeEmail}
                className="w-full py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-[12px] font-semibold cursor-pointer border border-border transition-colors"
              >
                Save College Email Manually
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardClassroom;
