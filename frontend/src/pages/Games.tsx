import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  Swords,
  HelpCircle,
  Sparkles,
  Trophy,
  Zap,
  Flame,
  LayoutGrid,
  CheckCircle2,
  Layers,
  ArrowRight
} from "lucide-react";
import WebDevArena from "../components/WebDevArena";

export default function Games(): React.ReactElement {
  const [activeGameTab, setActiveGameTab] = useState<"webdev" | "overview">("webdev");

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Arena Navigation Banner */}
      <div className="h-12 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-bold tracking-tight text-foreground">
              SkillSphere Arenas
            </span>
          </div>

          {/* Arena Tabs */}
          <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setActiveGameTab("webdev")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeGameTab === "webdev"
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>WebDev Studio</span>
              <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-mono">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveGameTab("overview")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeGameTab === "overview"
                  ? "bg-card text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Game Modes</span>
            </button>
          </div>
        </div>

        {/* Right Stats & Quick Actions */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 font-mono text-muted-foreground">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Streak: <strong className="text-foreground">5 Days</strong></span>
          </div>
          <Link
            to="/quizzes"
            className="flex items-center gap-1 text-primary hover:underline font-semibold"
          >
            <span>Go to 1v1 Duels</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeGameTab === "webdev" ? (
          <WebDevArena />
        ) : (
          <div className="h-full overflow-y-auto p-8 max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Battle Arenas & Skill Challenges
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose your discipline. Build responsive frontend applications, duel algorithmic rivals in real time, or test rapid-fire knowledge.
              </p>
            </div>

            {/* Mode Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* WebDev Arena Card */}
              <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none" />
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">WebDev Arena</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase font-mono">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Full-stack interactive sandbox. Code HTML, CSS, and modern JavaScript with real-time responsive device emulation, automated test verification, and live console inspection.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span>Live iframe preview & hot reloading</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span>Automated DOM & JS verification tests</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span>Responsive viewport emulation</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setActiveGameTab("webdev")}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-sm cursor-pointer"
                >
                  Enter WebDev Studio →
                </button>
              </div>

              {/* DSA 1v1 Sprint Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground mb-4">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">DSA Sprint</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 uppercase font-mono">
                      1v1 Battle
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Head-to-head competitive programming showdown. Race against a rival developer to solve algorithmic challenges in Python, C++, or JavaScript with remote Judge0 execution.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Live socket synchronizer & room codes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>50+ algorithmic challenge bank</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Real-time opponent score radar</span>
                    </li>
                  </ul>
                </div>
                <Link
                  to="/quizzes"
                  className="w-full py-2.5 rounded-lg bg-secondary border border-border text-foreground font-bold text-xs text-center hover:bg-secondary/80 transition block"
                >
                  Launch 1v1 Duel →
                </Link>
              </div>

              {/* Quiz Blitz Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground mb-4">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-foreground">Quiz Blitz</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground uppercase font-mono">
                      Assessment
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Timed multi-category technical assessments across Linux, DevOps, JavaScript, SQL, and System Design. Instant grading and progress tracking.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Dynamic category & difficulty tuning</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Instant accuracy breakdown</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Timed countdown pressure</span>
                    </li>
                  </ul>
                </div>
                <Link
                  to="/quizzes"
                  className="w-full py-2.5 rounded-lg bg-secondary border border-border text-foreground font-bold text-xs text-center hover:bg-secondary/80 transition block"
                >
                  Start Assessment →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
