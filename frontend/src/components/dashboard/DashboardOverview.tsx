import React from "react";
import {
  GraduationCap,
  Calendar,
  CheckSquare,
  Image as ImageIcon,
  TrendingUp,
  ArrowRight,
  Clock,
  Video,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DeveloperActivityCard from "./DeveloperActivityCard";

interface DashboardOverviewProps {
  userName: string;
  onNavigate: (section: "media" | "todo" | "jobs" | "classroom" | "calendar" | "activity" | "settings") => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ userName, onNavigate }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto text-foreground">
      {/* Welcome Bar */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-white">
            Welcome back, {userName}
          </h2>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">
            Overview of your coursework, meetings, and developer activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate("calendar")}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border-none"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Join Meeting</span>
          </button>
          <button
            onClick={() => onNavigate("media")}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer border-none"
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
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Classroom</span>
            <div className="text-[20px] font-semibold text-white mt-0.5 tabular-nums">3 Pending</div>
            <p className="text-[12px] text-emerald-400 font-medium mt-1 truncate">
              Problem Set 4 due tomorrow
            </p>
          </div>
        </div>

        {/* Google Calendar Card */}
        <div
          onClick={() => onNavigate("calendar")}
          className="p-4 rounded-xl bg-card border border-border hover:border-blue-500/50 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Calendar</span>
            <div className="text-[20px] font-semibold text-white mt-0.5 tabular-nums">2 Today</div>
            <p className="text-[12px] text-blue-400 font-medium mt-1 truncate">
              Project Sync at 10:30 AM
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">To-Do Tasks</span>
            <div className="text-[20px] font-semibold text-white mt-0.5 tabular-nums">3 Active</div>
            <p className="text-[12px] text-[#94A3B8] font-medium mt-1 truncate">
              Graph Theory practice pending
            </p>
          </div>
        </div>

        {/* Media & Resources Card */}
        <div
          onClick={() => onNavigate("media")}
          className="p-4 rounded-xl bg-card border border-border hover:border-purple-500/50 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="mt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Media & Resources</span>
            <div className="text-[20px] font-semibold text-white mt-0.5">JPG Notes</div>
            <p className="text-[12px] text-purple-400 font-medium mt-1 truncate">
              Diagrams, cheatsheets, and links
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
            <h3 className="text-[14px] font-semibold text-[#E2E8F0] flex items-center gap-2">
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
            <div className="p-3 rounded-lg bg-secondary/30 border border-border flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 tabular-nums">
                  10:30 AM - 11:15 AM
                </span>
                <h4 className="text-[14px] font-semibold text-[#E2E8F0] mt-1.5">
                  Google Meet: CS Final Project Sprint & Architecture Sync
                </h4>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">Alex Chen (Tech Lead)</p>
              </div>
              <a
                href="https://meet.google.com/abc-defg-hij"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs shrink-0 no-underline"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Join</span>
              </a>
            </div>

            <div className="p-3 rounded-lg bg-secondary/30 border border-border flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 tabular-nums">
                  6:00 PM - 6:45 PM
                </span>
                <h4 className="text-[14px] font-semibold text-[#E2E8F0] mt-1.5">
                  SkillSphere 1v1 Algorithmic Duel vs Alex
                </h4>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">Competitive Programming Arena</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-secondary text-[12px] font-semibold text-white tabular-nums">
                +35 Elo
              </span>
            </div>
          </div>
        </div>

        {/* Pending Classroom Assignments */}
        <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-[#E2E8F0] flex items-center gap-2">
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
            <div className="p-3 rounded-lg bg-secondary/30 border border-border flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
                  CS-301: DSA
                </span>
                <h4 className="text-[14px] font-semibold text-[#E2E8F0] mt-1.5">
                  Problem Set 4: Dynamic Programming & Knapsack Variations
                </h4>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">Due Tomorrow at 11:59 PM • 100 pts</p>
              </div>
              <a
                href="https://classroom.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-3 rounded-lg bg-secondary/30 border border-border flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400">
                  SE-402: Software Eng
                </span>
                <h4 className="text-[14px] font-semibold text-[#E2E8F0] mt-1.5">
                  Lab 5: Distributed Caching with Redis & Rate Limiting
                </h4>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">Due in 3 days • 50 pts</p>
              </div>
              <a
                href="https://classroom.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;

