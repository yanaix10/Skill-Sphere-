import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Plus,
  BookOpen,
  UserCheck,
  Check,
  X,
  FileCheck,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "../../firebase";

export interface ClassroomCourse {
  id: string;
  name: string;
  section: string;
  teacher: string;
  roomCode: string;
  color: string;
  link: string;
}

export interface ClassroomAssignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date string or formatted
  dueTime?: string;
  submitted: boolean;
  points: number;
  link?: string;
}

const DEFAULT_COURSES: ClassroomCourse[] = [
  {
    id: "course-1",
    name: "CS-301: Data Structures & Algorithms",
    section: "CS-A",
    teacher: "Prof. Arvind Sharma",
    roomCode: "dsa301x",
    color: "emerald",
    link: "https://classroom.google.com",
  },
  {
    id: "course-2",
    name: "SE-402: Software Engineering & System Architecture",
    section: "CS-B",
    teacher: "Dr. Evelyn Miller",
    roomCode: "se402sys",
    color: "blue",
    link: "https://classroom.google.com",
  },
  {
    id: "course-3",
    name: "MATH-240: Discrete Mathematics & Graph Theory",
    section: "MATH-2",
    teacher: "Prof. David Clark",
    roomCode: "math240g",
    color: "purple",
    link: "https://classroom.google.com",
  },
  {
    id: "course-4",
    name: "AI-101: Introduction to Machine Learning",
    section: "AI-Elective",
    teacher: "Dr. Rohini Roy",
    roomCode: "ml101ai",
    color: "amber",
    link: "https://classroom.google.com",
  },
];

const DEFAULT_ASSIGNMENTS: ClassroomAssignment[] = [
  {
    id: "assign-1",
    courseId: "course-1",
    courseName: "CS-301: Data Structures & Algorithms",
    title: "Problem Set 4: Dynamic Programming & Knapsack Variations",
    description: "Implement memoized and bottom-up solutions for 0/1 Knapsack, Coin Change II, and Longest Common Subsequence.",
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    dueTime: "11:59 PM",
    submitted: false,
    points: 100,
    link: "https://classroom.google.com",
  },
  {
    id: "assign-2",
    courseId: "course-2",
    courseName: "SE-402: Software Engineering & System Architecture",
    title: "Lab 5: Distributed Caching with Redis & Rate Limiting",
    description: "Submit repository URL with Docker compose configuration and token bucket algorithm test bench.",
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    dueTime: "5:00 PM",
    submitted: false,
    points: 50,
    link: "https://classroom.google.com",
  },
  {
    id: "assign-3",
    courseId: "course-3",
    courseName: "MATH-240: Discrete Mathematics & Graph Theory",
    title: "Homework 7: Dijkstra's Algorithm & Prim's Minimal Spanning Tree",
    description: "Solve problems 4.1 to 4.12 on Graph Theory proofs and complexity analysis.",
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    dueTime: "11:59 PM",
    submitted: false,
    points: 40,
    link: "https://classroom.google.com",
  },
  {
    id: "assign-4",
    courseId: "course-4",
    courseName: "AI-101: Introduction to Machine Learning",
    title: "Project 2: Sentiment Classification using PyTorch",
    description: "Train a Bi-LSTM or simple Transformer encoder on the IMDb dataset with >88% validation accuracy.",
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueTime: "11:59 PM",
    submitted: true,
    points: 100,
    link: "https://classroom.google.com",
  },
];

export const DashboardClassroom: React.FC = () => {
  const [courses, setCourses] = useState<ClassroomCourse[]>(DEFAULT_COURSES);
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>(DEFAULT_ASSIGNMENTS);
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return localStorage.getItem("skillsphere_classroom_connected") !== "false";
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [filter, setFilter] = useState<"pending" | "submitted" | "all">("pending");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);

  const user = auth.currentUser;
  const personalEmail = user?.email || "naitik.yadav641@gmail.com";

  const [classroomEmail, setClassroomEmail] = useState<string>(() => {
    return localStorage.getItem("skillsphere_classroom_email") || "";
  });
  const [isCollegeAccount, setIsCollegeAccount] = useState<boolean>(() => {
    return localStorage.getItem("skillsphere_classroom_is_college") === "true";
  });
  const [collegeEmailInput, setCollegeEmailInput] = useState<string>(
    localStorage.getItem("skillsphere_classroom_email") || "naitik.yadav@vitstudent.ac.in"
  );

  const effectiveEmail = classroomEmail || personalEmail;

  const handleSaveCollegeEmail = () => {
    if (!collegeEmailInput.trim()) return;
    const clean = collegeEmailInput.trim().toLowerCase();
    setClassroomEmail(clean);
    setIsCollegeAccount(true);
    localStorage.setItem("skillsphere_classroom_email", clean);
    localStorage.setItem("skillsphere_classroom_is_college", "true");
    setShowAccountModal(false);
    handleSync();
  };

  const handleUsePersonalEmail = () => {
    setClassroomEmail(personalEmail);
    setIsCollegeAccount(false);
    localStorage.setItem("skillsphere_classroom_email", personalEmail);
    localStorage.setItem("skillsphere_classroom_is_college", "false");
    setShowAccountModal(false);
    handleSync();
  };

  // Form state for adding custom assignment
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    courseName: DEFAULT_COURSES[0].name,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    dueTime: "11:59 PM",
    points: 50,
    description: "",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("skillsphere_classroom_assignments");
      if (stored) {
        setAssignments(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const saveAssignments = (data: ClassroomAssignment[]) => {
    setAssignments(data);
    try {
      localStorage.setItem("skillsphere_classroom_assignments", JSON.stringify(data));
    } catch (e) {}
  };

  const handleToggleSubmit = (id: string) => {
    const updated = assignments.map((a) => (a.id === id ? { ...a, submitted: !a.submitted } : a));
    saveAssignments(updated);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      localStorage.setItem("skillsphere_classroom_connected", "true");
      setIsConnected(true);
    }, 1200);
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
      courseName: DEFAULT_COURSES[0].name,
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
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-white m-0">
              Google Classroom
            </h2>
          </div>
        </div>

        {/* Sync / Switch Account / Add Controls */}
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
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-[#E2E8F0] text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-border"
            title="Refresh Google Classroom sync"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-emerald-400", isSyncing && "animate-spin")} />
            <span>{isSyncing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Course Enrollment Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#E2E8F0] flex items-center gap-1.5">
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
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-[#94A3B8]">
                    {course.section}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                </div>
                <h4 className="text-[14px] font-semibold text-[#E2E8F0] group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {course.name}
                </h4>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-border/60 text-[12px] text-[#94A3B8] flex items-center justify-between">
                <span className="truncate">{course.teacher}</span>
                <span className="font-mono text-[10px] text-muted-foreground/80">{course.roomCode}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

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
          Turned In / Done ({submittedList.length})
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
          All Coursework ({assignments.length})
        </button>
      </div>

      {/* Assignments List */}
      <div className="space-y-2.5">
        {displayList.length === 0 ? (
          <div className="p-10 text-center rounded-xl bg-card border border-border text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
            <p className="text-[14px] font-semibold text-[#E2E8F0]">You are all caught up!</p>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">No pending Google Classroom tasks due right now.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayList.map((assign) => (
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
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-[#94A3B8] tabular-nums">
                        {assign.points} pts
                      </span>
                    </div>

                    <h4
                      className={cn(
                        "text-[14px] font-semibold text-[#E2E8F0]",
                        assign.submitted && "line-through text-muted-foreground"
                      )}
                    >
                      {assign.title}
                    </h4>

                    {assign.description && (
                      <p className="text-[12px] text-[#94A3B8] line-clamp-2 max-w-2xl">{assign.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#E2E8F0] justify-end tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{assign.dueTime || "11:59 PM"}</span>
                    </div>
                    <div className="text-[12px] font-medium text-emerald-400">
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
            ))}
          </div>
        )}
      </div>

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
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Course</label>
                <select
                  value={newAssignment.courseName}
                  onChange={(e) => setNewAssignment({ ...newAssignment, courseName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="General Coursework">Other / Independent Study</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Algorithms Lab 4"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
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
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-[14px] font-semibold text-white">
                  Link College / University Google Account
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
              SkillSphere allows you to sign in with your personal Google email while synchronizing Google Classroom tasks directly from your college / university Google Workspace account.
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
                <div className="text-[#94A3B8]">Currently Active Classroom Account:</div>
                <div className="font-mono text-white text-[12px] font-medium break-all">
                  {effectiveEmail} {isCollegeAccount && <span className="text-emerald-400 font-semibold">(College Linked)</span>}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveCollegeEmail}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer border-none transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Save & Connect College Account</span>
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

export default DashboardClassroom;

