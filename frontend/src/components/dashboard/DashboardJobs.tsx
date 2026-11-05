import React, { useState, useEffect } from "react";
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
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const DEFAULT_JOBS: JobApplication[] = [
  {
    id: "job-1",
    title: "Full Stack Engineer (Intern)",
    company: "Google Cloud",
    status: "interview",
    location: "Bengaluru, India / Hybrid",
    salary: "₹1,20,000 / month",
    date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10),
    link: "https://careers.google.com",
    notes: "Round 2: System design & concurrency duel scheduled on Google Meet.",
  },
  {
    id: "job-2",
    title: "Software Development Engineer 1",
    company: "Amazon Web Services",
    status: "applied",
    location: "Hyderabad, India",
    salary: "₹24 LPA",
    date: new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10),
    link: "https://amazon.jobs",
    notes: "Online assessment submitted with 100% test cases passing.",
  },
  {
    id: "job-3",
    title: "Junior Backend Developer",
    company: "Stripe",
    status: "saved",
    location: "Remote",
    salary: "$95,000 / year",
    date: new Date().toISOString().slice(0, 10),
    link: "https://stripe.com/jobs",
    notes: "Requires strong TypeScript and socket architecture experience.",
  },
  {
    id: "job-4",
    title: "Systems Software Engineer",
    company: "Bloomberg",
    status: "offer",
    location: "London / Remote",
    salary: "£75,000",
    date: new Date(Date.now() - 86400000 * 18).toISOString().slice(0, 10),
    link: "https://bloomberg.com/careers",
    notes: "Offer letter received. Decision deadline by end of next week.",
  },
];

const STATUS_STYLES: Record<JobApplication["status"], { bg: string; text: string; label: string }> = {
  saved:     { bg: "bg-zinc-500/15 border-zinc-500/30", text: "text-zinc-400", label: "Saved" },
  applied:   { bg: "bg-blue-500/15 border-blue-500/30", text: "text-blue-500", label: "Applied" },
  interview: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-500", label: "Interview" },
  offer:     { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-500", label: "Offer" },
  rejected:  { bg: "bg-red-500/15 border-red-500/30", text: "text-red-500", label: "Rejected" },
};

export const DashboardJobs: React.FC = () => {
  const [jobs, setJobs] = useState<JobApplication[]>(DEFAULT_JOBS);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

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

  useEffect(() => {
    try {
      const stored = localStorage.getItem("skillsphere_home_jobs");
      if (stored) {
        setJobs(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const saveJobs = (data: JobApplication[]) => {
    setJobs(data);
    try {
      localStorage.setItem("skillsphere_home_jobs", JSON.stringify(data));
    } catch (e) {}
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) return;

    const newItem: JobApplication = {
      id: `job-${Date.now()}`,
      ...form,
    };

    saveJobs([newItem, ...jobs]);
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

  const handleChangeStatus = (id: string, newStatus: JobApplication["status"]) => {
    const updated = jobs.map((j) => (j.id === id ? { ...j, status: newStatus } : j));
    saveJobs(updated);
  };

  const filteredJobs = jobs.filter((j) => {
    if (filter !== "all" && j.status !== filter) return false;
    if (
      search &&
      !j.title.toLowerCase().includes(search.toLowerCase()) &&
      !j.company.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-primary" />
            Job & Internship Applications
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Track interview pipelines, offers, salary details, and application links
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer border-none self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Status Pipeline Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["saved", "applied", "interview", "offer", "rejected"] as const).map((st) => {
          const style = STATUS_STYLES[st];
          const count = jobs.filter((j) => j.status === st).length;

          return (
            <button
              key={st}
              onClick={() => setFilter(filter === st ? "all" : st)}
              className={cn(
                "p-3.5 rounded-2xl bg-card border text-left transition-all cursor-pointer shadow-xs",
                filter === st ? "ring-2 ring-primary border-primary" : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={cn("px-2 py-0.5 rounded-md border text-[10px] uppercase font-mono", style.bg, style.text)}>
                  {style.label}
                </span>
                <span className="font-mono text-base font-black text-foreground">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
              filter === "all"
                ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border-border"
            )}
          >
            All Applications ({jobs.length})
          </button>
          {(["applied", "interview", "offer"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                filter === st
                  ? "bg-foreground text-background border-foreground font-bold shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border"
              )}
            >
              {STATUS_STYLES[st].label} ({jobs.filter((j) => j.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Job Cards Grid */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-card border border-border text-muted-foreground">
            <Briefcase className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold">No applications found</p>
            <p className="text-xs mt-1">Add your target roles and track your application milestones</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => {
              const style = STATUS_STYLES[job.status] || STATUS_STYLES.saved;

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-primary uppercase tracking-wide">
                            {job.company}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-foreground mt-0.5">{job.title}</h4>
                      </div>

                      {/* Status selector */}
                      <select
                        value={job.status}
                        onChange={(e) => handleChangeStatus(job.id, e.target.value as any)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-bold border uppercase font-mono cursor-pointer bg-background focus:outline-none",
                          style.text,
                          style.bg
                        )}
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                      {job.location && (
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {job.location}
                        </span>
                      )}
                      {job.salary && (
                        <span className="flex items-center gap-1 font-mono text-foreground font-semibold">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          {job.salary}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {job.date}
                      </span>
                    </div>

                    {job.notes && (
                      <p className="text-xs text-muted-foreground pt-1 border-t border-border/60">
                        {job.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    {job.link ? (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold no-underline"
                      >
                        <span>View Job Posting</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No link attached</span>
                    )}

                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                      title="Delete Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddJob}
            className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Add Job Application
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Role / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Engineer"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Cloud"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / Bengaluru"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Salary / Stipend</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹20 LPA"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Application Link</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Notes / Follow-ups</label>
                <textarea
                  rows={2}
                  placeholder="Interview dates, referral contacts, or requirements..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-xs cursor-pointer border-none"
              >
                Save Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardJobs;
