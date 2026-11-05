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
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatChip, { ApplicationStatus } from "@/components/ui/stat-chip";

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

export const DashboardJobs: React.FC = () => {
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
    <div className="space-y-5 max-w-7xl mx-auto text-foreground">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
        <h2 className="text-[18px] font-semibold tracking-tight text-foreground m-0">
          Job applications
        </h2>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-1.5 hover:opacity-95 transition-all shadow-xs cursor-pointer border-none self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New application</span>
        </button>
      </div>

      {/* Unified Status Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Job Cards Grid */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-card border border-border text-muted-foreground">
            <Briefcase className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-[14px] font-semibold text-foreground">No applications found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all shadow-xs flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-[15px] font-semibold text-foreground">{job.title}</h4>
                      <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="font-medium text-foreground/90">{job.company}</span>
                      </div>
                    </div>

                    <select
                      value={job.status}
                      onChange={(e) =>
                        handleStatusChange(job.id, e.target.value as JobApplication["status"])
                      }
                      className="text-[12px] font-medium px-2 py-1 rounded-md border border-border bg-surface-muted text-foreground cursor-pointer focus:outline-none"
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground pt-1">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        {job.location}
                      </span>
                    )}
                    {job.salary && (
                      <span className="flex items-center gap-1 font-mono">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                        {job.salary}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {job.date}
                    </span>
                  </div>

                  {job.notes && (
                    <p className="text-[12px] text-muted-foreground p-2 rounded-md bg-surface-muted/60 border border-border/40 mt-1 line-clamp-2">
                      {job.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[12px]">
                  {job.link ? (
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Posting link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span />
                  )}

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-none bg-transparent"
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

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-[16px] font-semibold text-foreground">Track new application</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddJob} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                    Job title *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Frontend Engineer"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                    Company *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Vercel"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1">
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
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                    Salary / Compensation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $120k / ₹20 LPA"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                  Posting or application URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Next steps, interview round details, recruiter contact..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-surface-muted text-[13px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-95 cursor-pointer border-none shadow-xs"
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

export default DashboardJobs;
