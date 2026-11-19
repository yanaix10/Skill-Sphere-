import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface CategoryStat {
  name: string;
  accuracy: number; // 0 - 100
  attempted: number;
  correct: number;
}

export interface SkillProgressItem {
  label: string;
  value: number; // 0 - 100
  attempted: number;
  correct: number;
  indicatorClass: string;
  trackClass: string;
}

export interface QuizSessionRecord {
  id: string;
  category: string;
  score: number;
  total: number;
  tags?: string[];
  timestamp: number; // Date.now()
  type: "quiz" | "duel";
}

export interface RealtimeQuizStats {
  streak: number;
  accuracy7d: number;
  solvedThisWeek: number;
  categories: {
    "Web Dev": CategoryStat;
    SQL: CategoryStat;
    Linux: CategoryStat;
    DevOps: CategoryStat;
    Code: CategoryStat;
    Cloud: CategoryStat;
  };
  skills: Record<string, { attempted: number; correct: number }>;
  recentSessions: QuizSessionRecord[];
}

export const STAT_UPDATED_EVENT = "skillsphere_stats_updated";
const STORAGE_STATS_KEY = "skillsphere_quiz_realtime_stats";

export const DEFAULT_SKILLS_META = [
  {
    label: "React / Next.js",
    indicatorClass: "**:data-[slot='progress-indicator']:bg-blue-500!",
    trackClass: "**:data-[slot='progress-track']:bg-blue-500/20!",
    relevantCategories: ["Web Dev", "Code"],
    relevantKeywords: ["react", "next", "jsx", "tsx", "frontend", "hooks", "dom", "component"],
  },
  {
    label: "TypeScript",
    indicatorClass: "**:data-[slot='progress-indicator']:bg-orange-400!",
    trackClass: "**:data-[slot='progress-track']:bg-orange-400/20!",
    relevantCategories: ["Code", "Web Dev"],
    relevantKeywords: ["typescript", "ts", "javascript", "js", "types", "generics", "interface"],
  },
  {
    label: "Tailwind CSS",
    indicatorClass: "**:data-[slot='progress-indicator']:bg-sky-400!",
    trackClass: "**:data-[slot='progress-track']:bg-sky-400/20!",
    relevantCategories: ["Web Dev"],
    relevantKeywords: ["tailwind", "css", "html", "style", "flexbox", "grid", "responsive"],
  },
  {
    label: "Node.js",
    indicatorClass: "**:data-[slot='progress-indicator']:bg-teal-400!",
    trackClass: "**:data-[slot='progress-track']:bg-teal-400/20!",
    relevantCategories: ["DevOps", "Linux", "SQL", "Code"],
    relevantKeywords: ["node", "express", "backend", "server", "api", "npm", "async", "event loop"],
  },
  {
    label: "UI / UX Design",
    indicatorClass: "**:data-[slot='progress-indicator']:bg-amber-300!",
    trackClass: "**:data-[slot='progress-track']:bg-amber-300/20!",
    relevantCategories: ["Web Dev"],
    relevantKeywords: ["ui", "ux", "design", "accessibility", "a11y", "color", "typography", "animation"],
  },
];

// Real zero-baseline — stats are earned, never faked
const DEFAULT_INITIAL_STATS: RealtimeQuizStats = {
  streak: 0,
  accuracy7d: 0,
  solvedThisWeek: 0,
  categories: {
    "Web Dev": { name: "Web Dev", accuracy: 0, attempted: 0, correct: 0 },
    SQL: { name: "SQL", accuracy: 0, attempted: 0, correct: 0 },
    Linux: { name: "Linux", accuracy: 0, attempted: 0, correct: 0 },
    DevOps: { name: "DevOps", accuracy: 0, attempted: 0, correct: 0 },
    Code: { name: "Code", accuracy: 0, attempted: 0, correct: 0 },
    Cloud: { name: "Cloud", accuracy: 0, attempted: 0, correct: 0 },
  },
  skills: {
    "React / Next.js": { attempted: 0, correct: 0 },
    "TypeScript": { attempted: 0, correct: 0 },
    "Tailwind CSS": { attempted: 0, correct: 0 },
    "Node.js": { attempted: 0, correct: 0 },
    "UI / UX Design": { attempted: 0, correct: 0 },
  },
  recentSessions: [],
};

export function getRealtimeQuizStats(): RealtimeQuizStats {
  if (typeof window === "undefined") return DEFAULT_INITIAL_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_INITIAL_STATS,
        ...parsed,
        categories: {
          ...DEFAULT_INITIAL_STATS.categories,
          ...(parsed.categories || {}),
        },
        skills: {
          ...DEFAULT_INITIAL_STATS.skills,
          ...(parsed.skills || {}),
        },
      };
    }
  } catch (e) {
    console.warn("[quizStats] Error reading stored stats:", e);
  }
  return DEFAULT_INITIAL_STATS;
}

function calculateStreak(sessions: QuizSessionRecord[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const daysSet = new Set<string>();
  sessions.forEach((s) => {
    const dateStr = new Date(s.timestamp).toISOString().split("T")[0];
    daysSet.add(dateStr);
  });

  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split("T")[0];
    if (daysSet.has(dStr)) {
      streak += 1;
    } else if (i === 0) {
      // Haven't taken today yet, check yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}

function calculate7dAccuracy(sessions: QuizSessionRecord[]): number {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = sessions.filter((s) => s.timestamp >= oneWeekAgo);

  if (recent.length === 0) return 0;

  const totalAttempted = recent.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCorrect = recent.reduce((sum, s) => sum + (s.score || 0), 0);

  if (totalAttempted === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((totalCorrect / totalAttempted) * 100)));
}

export function saveQuizStats(stats: RealtimeQuizStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
    window.dispatchEvent(new Event(STAT_UPDATED_EVENT));

    const user = auth.currentUser;
    if (user && user.uid !== "test-user-123") {
      setDoc(doc(db, "users", user.uid), { quizStats: stats }, { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.error("[quizStats] Error saving stats:", err);
  }
}

export function recordPracticeAttempt(
  categoryName: string,
  score: number,
  total: number,
  tags: string[] = []
): RealtimeQuizStats {
  const current = getRealtimeQuizStats();
  const safeCat = (categoryName || "Web Dev") as keyof typeof current.categories;

  const prevCat = current.categories[safeCat] || {
    name: categoryName,
    accuracy: 0,
    attempted: 0,
    correct: 0,
  };

  const newAttempted = prevCat.attempted + total;
  const newCorrect = prevCat.correct + score;
  const newAccuracy = newAttempted > 0 ? Math.min(100, Math.max(0, Math.round((newCorrect / newAttempted) * 100))) : 0;

  const newSession: QuizSessionRecord = {
    id: "session_" + Math.random().toString(36).substring(2, 9),
    category: categoryName,
    score,
    total,
    tags,
    timestamp: Date.now(),
    type: "quiz",
  };

  const updatedSessions = [newSession, ...(current.recentSessions || [])].slice(0, 50);

  // Update Skill sets based on tags and category
  const updatedSkills = { ...(current.skills || {}) };
  const lowerCat = categoryName.toLowerCase();
  const lowerTags = tags.map((t) => t.toLowerCase());

  DEFAULT_SKILLS_META.forEach((meta) => {
    const isCategoryMatch = meta.relevantCategories.some((c) => lowerCat.includes(c.toLowerCase()));
    const isTagMatch = meta.relevantKeywords.some((kw) =>
      lowerTags.some((t) => t.includes(kw)) || lowerCat.includes(kw)
    );

    if (isCategoryMatch || isTagMatch) {
      const prevSkill = updatedSkills[meta.label] || { attempted: 0, correct: 0 };
      updatedSkills[meta.label] = {
        attempted: prevSkill.attempted + total,
        correct: prevSkill.correct + score,
      };
    }
  });

  const updatedStats: RealtimeQuizStats = {
    ...current,
    streak: calculateStreak(updatedSessions),
    accuracy7d: calculate7dAccuracy(updatedSessions),
    solvedThisWeek: current.solvedThisWeek + total,
    categories: {
      ...current.categories,
      [safeCat]: {
        ...prevCat,
        attempted: newAttempted,
        correct: newCorrect,
        accuracy: newAccuracy,
      },
    },
    skills: updatedSkills,
    recentSessions: updatedSessions,
  };

  saveQuizStats(updatedStats);
  return updatedStats;
}

export function recordDuelAttempt(
  track: string,
  solvedCount: number,
  totalQuestions: number
): RealtimeQuizStats {
  const categoryMap: Record<string, keyof RealtimeQuizStats["categories"]> = {
    webdev_arena: "Web Dev",
    dsa_sprint: "Code",
    fullstack_blitz: "Web Dev",
  };
  const cat = categoryMap[track] || "Web Dev";
  const tags = track === "webdev_arena" ? ["webdev", "javascript", "react", "html", "css"] : ["dsa", "algorithms", "python", "typescript"];
  return recordPracticeAttempt(cat, solvedCount, totalQuestions, tags);
}

export function useRealtimeQuizStats(): RealtimeQuizStats {
  const [stats, setStats] = useState<RealtimeQuizStats>(getRealtimeQuizStats);

  useEffect(() => {
    const handleUpdate = () => {
      setStats(getRealtimeQuizStats());
    };
    window.addEventListener(STAT_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(STAT_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return stats;
}

export function useSkillsProgress(): SkillProgressItem[] {
  const stats = useRealtimeQuizStats();

  return DEFAULT_SKILLS_META.map((meta) => {
    const entry = stats.skills?.[meta.label] || { attempted: 0, correct: 0 };
    const value = entry.attempted > 0 ? Math.min(100, Math.max(0, Math.round((entry.correct / entry.attempted) * 100))) : 0;

    return {
      label: meta.label,
      value,
      attempted: entry.attempted,
      correct: entry.correct,
      indicatorClass: meta.indicatorClass,
      trackClass: meta.trackClass,
    };
  });
}
