import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Trash2,
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  CheckCircle2,
  X,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatChip, { ApplicationStatus } from "@/components/ui/stat-chip";
import GlassWorkspace, { useGlass } from "./GlassWorkspace";

export interface JobApplication {
  id: string;
  title: string;
  company: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  location?: string;
  salary?: string;
  date: string;
  link?: string;
  notes?: string;
}

const DashboardJobsContent: React.FC = () => {
  const [jobs, setJobs] = useState<JobApplication[]>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_home_jobs");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [filter, setFilter] = useState<ApplicationStatus>("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const { settingsOpen, setSettingsOpen } = useGlass();

  const [form, setForm] = useState<Omit<JobApplication, "id">>({
    title: "",
    company: "",
    status: "applied",
    location: "",
    salary: "",
    date: new Date().toISOString().slice(0, 10),
    link: "",
    notes: "",
  });

  const saveJobs = (newJobs: JobApplication[]) => {
    setJobs(newJobs);
    try {
      localStorage.setItem("skillsphere_home_jobs", JSON.stringify(newJobs));
    } catch (e) {}
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) return;

    const newJob: JobApplication = {
      ...form,
      id: `job-${Date.now()}`,
    };

    saveJobs([newJob, ...jobs]);
    setShowAddModal(false);
    setForm({
      title: "",
      company: "",
      status: "applied",
      location: "",
      salary: "",
      date: new Date().toISOString().slice(0, 10),
      link: "",
      notes: "",
    });
  };

  const handleDeleteJob = (id: string) => {
    saveJobs(jobs.filter((j) => j.id !== id));
  };

  const handleStatusChange = (id: string, newStatus: JobApplication["status"]) => {
    saveJobs(
      jobs.map((j) => (j.id === id ? { ...j, status: newStatus } : j))
    );
  };

  const filteredJobs = jobs.filter((j) => {
    if (filter !== "all" && j.status !== filter) return false;
    if (
      search &&
      !j.company.toLowerCase().includes(search.toLowerCase()) &&
      !j.title.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const counts: Record<ApplicationStatus, number> = {
    all: jobs.length,
    saved: jobs.filter((j) => j.status === "saved").length,
    applied: jobs.filter((j) => j.status === "applied").length,
    interview: jobs.filter((j) => j.status === "interview").length,
    offer: jobs.filter((j) => j.status === "offer").length,
    rejected: jobs.filter((j) => j.status === "rejected").length,
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto text-foreground">
      {/* ─── 1. Top Action Bar (Glass Styled) ─── */}
      <div className="gw-glass p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-card/60 backdrop-blur-md border border-white/20 dark:border-white/10 flex items-center justify-center text-primary shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground m-0">
              Job applications
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track your internships, full-time offers, and interview rounds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="px-3 py-1.5 rounded-xl border border-border/70 text-foreground hover:bg-muted/40 text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-card/50 shadow-xs"
            title="Tune glass blur, opacity & edge highlights"
          >
            <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Adjust glass</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-95 transition-all shadow-xs cursor-pointer border-none"
          >
            <Plus className="w-4 h-4" />
            <span>New application</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Unified Status Chips & Search Bar (Glass Styled) ─── */}
      <div className="gw-glass p-3 sm:p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["all", "saved", "applied", "interview", "offer", "rejected"] as const).map(
            (st) => (
              <StatChip
                key={st}
                status={st}
                count={counts[st]}
                active={filter === st}
                onClick={() => setFilter(st)}
              />
            )
          )}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium shadow-xs"
          />
        </div>
      </div>

      {/* ─── 3. Job Cards Grid (Glass Styled) ─── */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="gw-glass p-12 text-center rounded-2xl shadow-xs text-muted-foreground">
            <Briefcase className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-[15px] font-semibold text-foreground">No applications found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;New application&quot; to start tracking your job pipeline.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="gw-glass p-4 sm:p-4.5 rounded-2xl shadow-xs hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between space-y-3.5 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[15px] font-semibold text-foreground truncate">{job.title}</h4>
                      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mt-0.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground/90 truncate">{job.company}</span>
                      </div>
                    </div>

                    <select
                      value={job.status}
                      onChange={(e) =>
                        handleStatusChange(job.id, e.target.value as JobApplication["status"])
                      }
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-xl border border-white/20 dark:border-white/10 bg-card/50 backdrop-blur-sm text-foreground cursor-pointer focus:outline-none shadow-xs shrink-0"
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground pt-0.5">
                    {job.location && (
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[120px]">{job.location}</span>
                      </span>
                    )}
                    {job.salary && (
                      <span className="flex items-center gap-0.5 font-mono font-medium">
                        <DollarSign className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span>{job.salary}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono text-[10.5px] text-muted-foreground/80">
                      <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>{job.date}</span>
                    </span>
                  </div>

                  {job.notes && (
                    <p className="text-[11px] text-muted-foreground p-2.5 rounded-xl bg-card/30 backdrop-blur-sm border border-white/10 dark:border-white/5 mt-1 line-clamp-2">
                      {job.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-border/40 text-[11px]">
                  {job.link ? (
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1.5 font-medium no-underline"
                    >
                      <span>Posting link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span />
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border-none bg-transparent"
                    title="Delete application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Add Application Modal (Glass Styled) ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="gw-glass border border-white/20 dark:border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-[17px] font-semibold text-foreground m-0">Track new application</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">
                    Job title *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Frontend Engineer"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-card/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">
                    Company *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Vercel"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-3.5 py-2 bg-card/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value as JobApplication["status"],
                      })
                    }
                    className="w-full px-3 py-2 bg-card/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3.5 py-2 bg-card/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $120k / ₹20 LPA"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full px-3.5 py-2 bg-card/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">
                  Posting or application URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="w-full px-3.5 py-2 bg-card/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted-foreground block mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Next steps, interview round details, recruiter contact..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-card/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-border/70 text-foreground hover:bg-card/50 text-[13px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-95 cursor-pointer border-none shadow-xs"
                >
                  Save application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const DashboardJobs: React.FC = () => {
  return (
    <GlassWorkspace brand="SkillSphere" useHostTheme={true}>
      <DashboardJobsContent />
    </GlassWorkspace>
  );
};

export default DashboardJobs;
