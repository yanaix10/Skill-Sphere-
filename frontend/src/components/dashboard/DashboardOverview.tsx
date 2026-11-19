import React, { useState, useEffect } from "react";
import GlassWorkspace, {
  WorkspaceTransaction,
  WorkspaceGoal,
  WorkspaceCashFlowPeriod,
} from "./GlassWorkspace";
import {
  GraduationCap,
  Calendar,
  CheckSquare,
  Image as ImageIcon,
  ArrowRight,
  Video,
} from "lucide-react";
import DeveloperActivityCard from "./DeveloperActivityCard";

interface DashboardOverviewProps {
  userName: string;
  onNavigate: (section: "media" | "todo" | "jobs" | "classroom" | "calendar" | "activity" | "settings") => void;
}

const DEFAULT_CASH_FLOW_PERIODS: WorkspaceCashFlowPeriod[] = [
  {
    id: "term",
    label: "Active Term",
    description: "Monthly skill milestones, stipend credits, and learning resource expenses.",
    points: [
      { label: "Jan", income: 2400, expenses: 1100 },
      { label: "Feb", income: 2900, expenses: 1450 },
      { label: "Mar", income: 3200, expenses: 1200 },
      { label: "Apr", income: 2800, expenses: 1600 },
      { label: "May", income: 3500, expenses: 1350 },
      { label: "Jun", income: 4100, expenses: 1500 },
    ],
  },
  {
    id: "month",
    label: "This Month",
    description: "Weekly learning grants and duel rewards.",
    points: [
      { label: "W1", income: 850, expenses: 320 },
      { label: "W2", income: 920, expenses: 410 },
      { label: "W3", income: 1100, expenses: 290 },
      { label: "W4", income: 1230, expenses: 480 },
    ],
  },
];

const DEFAULT_TRANSACTIONS: WorkspaceTransaction[] = [
  {
    id: "tx-1",
    name: "SkillSphere 1v1 Arena Prize",
    category: "Income",
    date: "Today, 4:20 PM",
    amount: 150,
    status: "Completed",
  },
  {
    id: "tx-2",
    name: "O'Reilly Learning Library",
    category: "Shopping",
    date: "Yesterday",
    amount: -49,
    status: "Completed",
  },
  {
    id: "tx-3",
    name: "Campus Cafe & Coffee",
    category: "Dining",
    date: "Nov 18",
    amount: -12.5,
    status: "Completed",
  },
  {
    id: "tx-4",
    name: "Hackathon Travel Grant",
    category: "Travel",
    date: "Nov 15",
    amount: -220,
    status: "Completed",
  },
  {
    id: "tx-5",
    name: "Academic Excellence Stipend",
    category: "Income",
    date: "Nov 10",
    amount: 1200,
    status: "Completed",
  },
];

const DEFAULT_GOALS: WorkspaceGoal[] = [
  {
    id: "g-1",
    name: "MacBook Pro M3 for CompSci",
    saved: 1650,
    target: 2000,
    color: "#0d9488",
  },
  {
    id: "g-2",
    name: "AWS Certified Developer Exam",
    saved: 120,
    target: 150,
    color: "#3b82f6",
  },
  {
    id: "g-3",
    name: "Summer Tech Conference",
    saved: 420,
    target: 600,
    color: "#f59e0b",
  },
];

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
    <div className="space-y-8 max-w-7xl mx-auto text-foreground">
      {/* ─── Glass Workspace: Full Overview Experience ─── */}
      <div className="rounded-3xl overflow-hidden border border-border shadow-sm">
        <GlassWorkspace
          brand="SkillSphere"
          userName={userName}
          balance={14250}
          balanceChange={{ percent: 12.4, label: "vs last term" }}
          account={{ name: "Innovation & Learning Grant", lastFour: "8821" }}
          periodLabel="Active Term · 2026"
          cashFlowPeriods={DEFAULT_CASH_FLOW_PERIODS}
          initialPeriodId="term"
          transactions={DEFAULT_TRANSACTIONS}
          goals={DEFAULT_GOALS}
          footerNote="Real-time workspace sync active across your devices."
          savingsNote="You're on track to reach your MacBook Pro savings goal 3 weeks ahead of schedule."
          currency="USD"
          theme="system"
          useHostTheme={true}
        />
      </div>

      {/* ─── Quick Actions & Widgets ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Quick Academic Hub</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("calendar")}
              className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer bg-card shadow-xs"
            >
              <Video className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Join meeting</span>
            </button>
            <button
              onClick={() => onNavigate("media")}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-all shadow-xs cursor-pointer border-none"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Upload notes</span>
            </button>
          </div>
        </div>

        {/* 4 Quiet Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Classroom */}
          <div
            onClick={() => onNavigate("classroom")}
            className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-md bg-muted border border-border/50 text-muted-foreground flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
                View <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-foreground">
                {pendingAssignments.length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Pending Assignments</div>
            </div>
          </div>

          {/* Calendar */}
          <div
            onClick={() => onNavigate("calendar")}
            className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-md bg-muted border border-border/50 text-muted-foreground flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
                Schedule <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-foreground">
                {todayMeetings.length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Today's Sessions</div>
            </div>
          </div>

          {/* Todos */}
          <div
            onClick={() => onNavigate("todo")}
            className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-md bg-muted border border-border/50 text-muted-foreground flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
                Tasks <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-foreground">
                {activeTodos.length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Active Checklist Items</div>
            </div>
          </div>

          {/* Media */}
          <div
            onClick={() => onNavigate("media")}
            className="p-4 rounded-xl bg-card border border-border hover:border-border/80 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-md bg-muted border border-border/50 text-muted-foreground flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
                Library <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-foreground">
                {mediaFiles.length}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Study Materials</div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Activity Card */}
      <DeveloperActivityCard />
    </div>
  );
};

export default DashboardOverview;
