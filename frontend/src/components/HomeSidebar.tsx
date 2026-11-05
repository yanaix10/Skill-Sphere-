import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import {
  Settings,
  Briefcase,
  CheckSquare,
  Image,
  ChevronRight,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  GraduationCap,
  X,
  Edit2,
  Check,
  Clock,
  Circle,
  CheckCircle2,
  Send,
  Building2,
  MapPin,
  Link as LinkIcon,
  Film,
  FileText,
  BookOpen,
  Headphones,
  Zap,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../context/ThemeContext";

/* ─── Types ──────────────────────────────────────────────────── */

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

interface JobApplication {
  id: string;
  title: string;
  company: string;
  status: "applied" | "interview" | "offer" | "rejected" | "saved";
  date: string;
  link?: string;
}

interface MediaLink {
  id: string;
  title: string;
  url: string;
  type: "video" | "article" | "course" | "podcast" | "other";
}

type SidebarSection = "settings" | "jobs" | "todo" | "media" | null;

/* ─── Status badge colors ───────────────────────────────────── */

const JOB_STATUS_STYLES: Record<JobApplication["status"], { bg: string; text: string; label: string }> = {
  saved:     { bg: "bg-zinc-500/15", text: "text-zinc-400",   label: "Saved" },
  applied:   { bg: "bg-blue-500/15", text: "text-blue-400",   label: "Applied" },
  interview: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Interview" },
  offer:     { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Offer" },
  rejected:  { bg: "bg-red-500/15", text: "text-red-400",     label: "Rejected" },
};

const renderMediaIcon = (type: MediaLink["type"]) => {
  switch (type) {
    case "video":
      return <Film className="w-4 h-4 text-cyan-400 shrink-0" />;
    case "article":
      return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
    case "course":
      return <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />;
    case "podcast":
      return <Headphones className="w-4 h-4 text-amber-400 shrink-0" />;
    default:
      return <LinkIcon className="w-4 h-4 text-purple-400 shrink-0" />;
  }
};

interface HomeSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

/* ─── Component ──────────────────────────────────────────────── */

const HomeSidebar: React.FC<HomeSidebarProps> = ({ isOpen = true, onToggle }) => {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SidebarSection>(null);

  // To-Do State
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");

  // Job Applications State
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState<Omit<JobApplication, "id">>({
    title: "", company: "", status: "saved", date: new Date().toISOString().slice(0, 10), link: "",
  });

  // Media Links State
  const [mediaLinks, setMediaLinks] = useState<MediaLink[]>([]);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaForm, setMediaForm] = useState<Omit<MediaLink, "id">>({
    title: "", url: "", type: "article",
  });

  const uid = auth.currentUser?.uid;

  /* ─── Load / Save helpers (Firestore + localStorage fallback) ─ */

  useEffect(() => {
    const loadData = async () => {
      // Try Firestore first
      if (uid && uid !== "test-user-123") {
        try {
          const ref = doc(db, "users", uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const d = snap.data();
            if (d.todos) setTodos(d.todos);
            if (d.jobApplications) setJobs(d.jobApplications);
            if (d.mediaLinks) setMediaLinks(d.mediaLinks);
            return;
          }
        } catch (e) {
          console.warn("Firestore load failed, falling back to local:", e);
        }
      }
      // Fallback: localStorage
      try {
        const local = localStorage.getItem("skillsphere_home_data");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.todos) setTodos(parsed.todos);
          if (parsed.jobs) setJobs(parsed.jobs);
          if (parsed.mediaLinks) setMediaLinks(parsed.mediaLinks);
        }
      } catch { }
    };
    loadData();
  }, [uid]);

  const persist = (updatedTodos?: TodoItem[], updatedJobs?: JobApplication[], updatedMedia?: MediaLink[]) => {
    const t = updatedTodos ?? todos;
    const j = updatedJobs ?? jobs;
    const m = updatedMedia ?? mediaLinks;

    // Save to localStorage always
    localStorage.setItem("skillsphere_home_data", JSON.stringify({ todos: t, jobs: j, mediaLinks: m }));

    // Save to Firestore if real user
    if (uid && uid !== "test-user-123") {
      const ref = doc(db, "users", uid);
      setDoc(ref, { todos: t, jobApplications: j, mediaLinks: m }, { merge: true }).catch(console.warn);
    }
  };

  /* ─── Todo actions ─────────────────────────────────────────── */

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const updated = [...todos, { id: Date.now().toString(), text: newTodo.trim(), done: false, createdAt: Date.now() }];
    setTodos(updated);
    setNewTodo("");
    persist(updated, undefined, undefined);
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTodos(updated);
    persist(updated, undefined, undefined);
  };

  const deleteTodo = (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    persist(updated, undefined, undefined);
  };

  /* ─── Job actions ──────────────────────────────────────────── */

  const addJob = () => {
    if (!jobForm.title.trim() || !jobForm.company.trim()) return;
    const updated = [...jobs, { ...jobForm, id: Date.now().toString() }];
    setJobs(updated);
    setShowJobForm(false);
    setJobForm({ title: "", company: "", status: "saved", date: new Date().toISOString().slice(0, 10), link: "" });
    persist(undefined, updated, undefined);
  };

  const deleteJob = (id: string) => {
    const updated = jobs.filter((j) => j.id !== id);
    setJobs(updated);
    persist(undefined, updated, undefined);
  };

  const updateJobStatus = (id: string, status: JobApplication["status"]) => {
    const updated = jobs.map((j) => (j.id === id ? { ...j, status } : j));
    setJobs(updated);
    persist(undefined, updated, undefined);
  };

  /* ─── Media actions ────────────────────────────────────────── */

  const addMedia = () => {
    if (!mediaForm.title.trim() || !mediaForm.url.trim()) return;
    const updated = [...mediaLinks, { ...mediaForm, id: Date.now().toString() }];
    setMediaLinks(updated);
    setShowMediaForm(false);
    setMediaForm({ title: "", url: "", type: "article" });
    persist(undefined, undefined, updated);
  };

  const deleteMedia = (id: string) => {
    const updated = mediaLinks.filter((m) => m.id !== id);
    setMediaLinks(updated);
    persist(undefined, undefined, updated);
  };

  /* ─── Nav items (Settings moved below Media & Resources) ─── */

  const navItems: { key: SidebarSection; icon: React.ReactNode; label: string; badge?: number }[] = [
    { key: "jobs", icon: <Briefcase className="w-4 h-4" />, label: "Job Applications", badge: jobs.filter((j) => j.status === "interview").length || undefined },
    { key: "todo", icon: <CheckSquare className="w-4 h-4" />, label: "To Do Tasks", badge: todos.filter((t) => !t.done).length || undefined },
    { key: "media", icon: <Image className="w-4 h-4" />, label: "Media & Resources" },
    { key: "settings", icon: <Settings className="w-4 h-4" />, label: "Settings" },
  ];

  /* ─── Render ───────────────────────────────────────────────── */

  return (
    <aside
      className={cn(
        "h-full bg-card border-r border-border flex flex-col font-sans text-card-foreground transition-all duration-300 select-none overflow-hidden shrink-0 z-20",
        isOpen ? "w-[280px]" : "w-0 border-r-0 p-0 opacity-0 pointer-events-none"
      )}
    >
      {/* Navigation Items */}
      <div className="p-2 space-y-0.5">
        <div className="px-3 pt-2 pb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Dashboard
          </span>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent"
              title="Hide sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveSection(activeSection === item.key ? null : item.key)}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer",
              "outline-none border-none",
              activeSection === item.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            <span className={cn(
              "flex items-center justify-center w-5 h-5 shrink-0",
              activeSection === item.key ? "text-primary" : "text-muted-foreground"
            )}>
              {item.icon}
            </span>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.badge && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold tabular-nums">
                {item.badge}
              </span>
            )}
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200",
                activeSection === item.key && "rotate-90"
              )}
            />
          </button>
        ))}

        {/* Google Integrations (Coming Soon) */}
        <div className="px-3 pt-3 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Integrations
          </span>
        </div>
        <div className="space-y-0.5">
          <button
            disabled
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground/50 cursor-not-allowed border-none bg-transparent"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="flex-1 text-left truncate">Google Classroom</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground">
              Soon
            </span>
          </button>
          <button
            disabled
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground/50 cursor-not-allowed border-none bg-transparent"
          >
            <Calendar className="w-4 h-4" />
            <span className="flex-1 text-left truncate">Google Calendar</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground">
              Soon
            </span>
          </button>
        </div>
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto border-t border-border">
        {/* ═══════════ SETTINGS ═══════════ */}
        {activeSection === "settings" && (
          <div className="p-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 m-0">
              <Settings className="w-3.5 h-3.5 text-primary" /> Settings
            </h4>

            {/* Theme Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Theme
              </label>
              <div className="flex gap-1">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer border",
                      theme === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:bg-secondary/80"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Account
              </label>
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border space-y-1">
                <div className="text-xs font-medium text-foreground truncate">
                  {auth.currentUser?.displayName || "User"}
                </div>
                <div className="text-[10px] text-muted-foreground truncate font-mono">
                  {auth.currentUser?.email || "—"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ JOB APPLICATIONS ═══════════ */}
        {activeSection === "jobs" && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 m-0">
                <Briefcase className="w-3.5 h-3.5 text-primary" /> Applications
              </h4>
              <button
                onClick={() => setShowJobForm(!showJobForm)}
                className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
              >
                {showJobForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Add Job Form */}
            {showJobForm && (
              <div className="space-y-2 p-2.5 rounded-lg bg-secondary/50 border border-border">
                <input
                  placeholder="Job Title"
                  value={jobForm.title}
                  onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-background text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                />
                <input
                  placeholder="Company"
                  value={jobForm.company}
                  onChange={(e) => setJobForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-background text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                />
                <div className="flex gap-1.5">
                  <select
                    value={jobForm.status}
                    onChange={(e) => setJobForm((f) => ({ ...f, status: e.target.value as JobApplication["status"] }))}
                    className="flex-1 px-2 py-1.5 bg-background text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input
                    type="date"
                    value={jobForm.date}
                    onChange={(e) => setJobForm((f) => ({ ...f, date: e.target.value }))}
                    className="flex-1 px-2 py-1.5 bg-background text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <input
                  placeholder="Link (optional)"
                  value={jobForm.link}
                  onChange={(e) => setJobForm((f) => ({ ...f, link: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-background text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                />
                <button
                  onClick={addJob}
                  className="w-full py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors cursor-pointer border-none"
                >
                  Add Application
                </button>
              </div>
            )}

            {/* Job List */}
            <div className="space-y-1.5">
              {jobs.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-4">
                  No applications yet. Click + to add one.
                </div>
              ) : (
                jobs.map((job) => {
                  const statusStyle = JOB_STATUS_STYLES[job.status];
                  return (
                    <div
                      key={job.id}
                      className="p-2.5 rounded-lg bg-secondary/40 border border-border/80 hover:bg-secondary/70 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-foreground truncate">{job.title}</div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Building2 className="w-2.5 h-2.5" />
                            <span className="truncate">{job.company}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {job.link && (
                            <a
                              href={job.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            onClick={() => deleteJob(job.id)}
                            className="p-0.5 rounded text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <select
                          value={job.status}
                          onChange={(e) => updateJobStatus(job.id, e.target.value as JobApplication["status"])}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border-none cursor-pointer",
                            statusStyle.bg, statusStyle.text
                          )}
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <span className="text-[10px] text-muted-foreground font-mono">{job.date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═══════════ TO-DO TASKS ═══════════ */}
        {activeSection === "todo" && (
          <div className="p-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 m-0">
              <CheckSquare className="w-3.5 h-3.5 text-primary" /> Tasks
            </h4>

            {/* Add Todo */}
            <div className="flex gap-1.5">
              <input
                placeholder="Add a task..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                className="flex-1 px-2.5 py-1.5 bg-secondary text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
              />
              <button
                onClick={addTodo}
                disabled={!newTodo.trim()}
                className="px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Stats */}
            {todos.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{todos.filter((t) => t.done).length}/{todos.length} completed</span>
                <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${(todos.filter((t) => t.done).length / todos.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Todo List */}
            <div className="space-y-1">
              {todos.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-4">
                  No tasks yet. Start adding some!
                </div>
              ) : (
                <>
                  {/* Pending tasks first */}
                  {todos
                    .filter((t) => !t.done)
                    .map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-secondary/40 border border-border/80 hover:bg-secondary/60 transition-colors group"
                      >
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer border-none bg-transparent p-0"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-xs text-foreground truncate">{todo.text}</span>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="shrink-0 p-0.5 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer border-none bg-transparent"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  {/* Completed tasks */}
                  {todos
                    .filter((t) => t.done)
                    .map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-secondary/20 border border-border/50 opacity-60 group"
                      >
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="shrink-0 text-primary cursor-pointer border-none bg-transparent p-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-xs text-muted-foreground truncate line-through">
                          {todo.text}
                        </span>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="shrink-0 p-0.5 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer border-none bg-transparent"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ MEDIA & RESOURCES ═══════════ */}
        {activeSection === "media" && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5 m-0">
                <Image className="w-3.5 h-3.5 text-primary" /> Media
              </h4>
              <button
                onClick={() => setShowMediaForm(!showMediaForm)}
                className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
              >
                {showMediaForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Add Media Form */}
            {showMediaForm && (
              <div className="space-y-2 p-2.5 rounded-lg bg-secondary/50 border border-border">
                <input
                  placeholder="Title"
                  value={mediaForm.title}
                  onChange={(e) => setMediaForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-background text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                />
                <input
                  placeholder="URL"
                  value={mediaForm.url}
                  onChange={(e) => setMediaForm((f) => ({ ...f, url: e.target.value }))}
                  className="w-full px-2.5 py-1.5 bg-background text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                />
                <select
                  value={mediaForm.type}
                  onChange={(e) => setMediaForm((f) => ({ ...f, type: e.target.value as MediaLink["type"] }))}
                  className="w-full px-2 py-1.5 bg-background text-foreground border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="course">Course</option>
                  <option value="podcast">Podcast</option>
                  <option value="other">Link / Resource</option>
                </select>
                <button
                  onClick={addMedia}
                  className="w-full py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors cursor-pointer border-none"
                >
                  Save Link
                </button>
              </div>
            )}

            {/* Media List */}
            <div className="space-y-1.5">
              {mediaLinks.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-4">
                  Save articles, videos, and courses here.
                </div>
              ) : (
                mediaLinks.map((m) => (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-secondary/40 border border-border/80 hover:bg-secondary/60 transition-colors group no-underline"
                  >
                    <span className="p-1 rounded-md bg-secondary/80 shrink-0">
                      {renderMediaIcon(m.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{m.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate font-mono">{m.url}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteMedia(m.id); }}
                        className="p-0.5 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        {/* Default: No section selected */}
        {activeSection === null && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Zap className="w-8 h-8 text-primary/50 mb-2.5 stroke-[1.5]" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select a section from above to get started
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default HomeSidebar;
