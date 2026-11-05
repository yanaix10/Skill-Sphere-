import React, { useState, useEffect } from "react";
import {
  Trophy,
  ExternalLink,
  Search,
  Star,
  GitFork,
  AlertCircle,
  TrendingUp,
  Award,
  UserCheck,
  Edit2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  html_url: string;
}

interface ChessUser {
  username: string;
  name?: string;
  avatar?: string;
  title?: string;
  url: string;
}

interface ChessStats {
  chess_rapid?: {
    last: { rating: number };
    best: { rating: number };
    record: { win: number; loss: number; draw: number };
  };
  chess_blitz?: {
    last: { rating: number };
    best: { rating: number };
    record: { win: number; loss: number; draw: number };
  };
  chess_bullet?: {
    last: { rating: number };
    best: { rating: number };
    record: { win: number; loss: number; draw: number };
  };
  tactics?: {
    highest: { rating: number };
  };
}

export const DeveloperActivityCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  // GitHub State - checks local storage / user profile
  const [githubUsername, setGithubUsername] = useState<string>(() => {
    return localStorage.getItem("skillsphere_github_username") || "";
  });
  const [githubInput, setGithubInput] = useState("");
  const [githubData, setGithubData] = useState<GitHubUser | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [isEditingGithub, setIsEditingGithub] = useState(false);

  // Chess.com State
  const [chessUsername, setChessUsername] = useState<string>(() => {
    return localStorage.getItem("skillsphere_chess_username") || "";
  });
  const [chessInput, setChessInput] = useState("");
  const [chessUser, setChessUser] = useState<ChessUser | null>(null);
  const [chessStats, setChessStats] = useState<ChessStats | null>(null);
  const [chessLoading, setChessLoading] = useState(false);
  const [chessError, setChessError] = useState<string | null>(null);
  const [isEditingChess, setIsEditingChess] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"github" | "chess">("github");

  // Load from user profile on mount
  useEffect(() => {
    const initProfiles = async () => {
      let savedGh = localStorage.getItem("skillsphere_github_username") || "";
      let savedChess = localStorage.getItem("skillsphere_chess_username") || "";

      const user = auth.currentUser;
      if (user && user.uid !== "test-user-123") {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.githubUsername && !savedGh) savedGh = data.githubUsername;
            if (data.chessUsername && !savedChess) savedChess = data.chessUsername;
          }
        } catch {}
      }

      if (savedGh) {
        setGithubUsername(savedGh);
        fetchGithub(savedGh);
      }
      if (savedChess) {
        setChessUsername(savedChess);
        fetchChess(savedChess);
      }
    };
    initProfiles();
  }, []);

  /* ─── Fetch GitHub Data ─── */
  const fetchGithub = async (username: string) => {
    if (!username.trim()) return;
    setGithubLoading(true);
    setGithubError(null);
    try {
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username.trim())}`);
      if (!userRes.ok) {
        if (userRes.status === 404) throw new Error("GitHub profile not found");
        throw new Error("Could not load GitHub profile");
      }
      const userData: GitHubUser = await userRes.json();
      setGithubData(userData);

      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username.trim())}/repos?sort=updated&per_page=3`
      );
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        if (Array.isArray(reposData)) {
          setGithubRepos(reposData);
        }
      }
      localStorage.setItem("skillsphere_github_username", username.trim());
      setGithubUsername(username.trim());
      setIsEditingGithub(false);
    } catch (err: any) {
      setGithubError(err.message || "Failed to load GitHub");
    } finally {
      setGithubLoading(false);
    }
  };

  /* ─── Fetch Chess.com Data ─── */
  const fetchChess = async (username: string) => {
    if (!username.trim()) return;
    setChessLoading(true);
    setChessError(null);
    try {
      const userRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username.trim().toLowerCase())}`);
      if (!userRes.ok) {
        if (userRes.status === 404) throw new Error("Chess.com player not found");
        throw new Error("Could not load Chess.com player");
      }
      const userData: ChessUser = await userRes.json();
      setChessUser(userData);

      const statsRes = await fetch(
        `https://api.chess.com/pub/player/${encodeURIComponent(username.trim().toLowerCase())}/stats`
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setChessStats(statsData);
      }
      localStorage.setItem("skillsphere_chess_username", username.trim().toLowerCase());
      setChessUsername(username.trim().toLowerCase());
      setIsEditingChess(false);
    } catch (err: any) {
      setChessError(err.message || "Failed to load Chess.com");
    } finally {
      setChessLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-card border border-border overflow-hidden shadow-xs text-foreground transition-colors">
      {/* Bento Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border bg-secondary/30 gap-3">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Developer & Gaming Activity
          </h3>
          <p className="text-[12px] text-muted-foreground">
            Connected GitHub contribution metrics and Chess.com performance
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary border border-border shrink-0">
          <button
            onClick={() => setActiveTab("github")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-all cursor-pointer border-none",
              activeTab === "github"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            )}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab("chess")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-all cursor-pointer border-none",
              activeTab === "chess"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            )}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Chess.com</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* ─── GITHUB SECTION ─── */}
        {activeTab === "github" && (
          <div className="space-y-4">
            {/* If no GitHub username set or editing, show connect prompt */}
            {(!githubUsername || isEditingGithub) ? (
              <div className="p-4 rounded-xl border border-dashed border-border bg-secondary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <GithubIcon className="w-4 h-4 text-primary" />
                    <span>Connect your GitHub Account</span>
                  </div>
                  {githubUsername && (
                    <button
                      onClick={() => setIsEditingGithub(false)}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Enter your GitHub username to display your annual contribution heatmap and repos.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchGithub(githubInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={githubInput}
                    onChange={(e) => setGithubInput(e.target.value)}
                    placeholder="e.g. torvalds or your username"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-background border border-border text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={githubLoading}
                    className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer border-none"
                  >
                    {githubLoading ? "Loading..." : "Connect"}
                  </button>
                </form>
              </div>
            ) : null}

            {githubError && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{githubError}</span>
              </div>
            )}

            {/* Concise GitHub Display */}
            {githubData && (
              <div className="space-y-3">
                {/* Compact Identity Row */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                  <div className="flex items-center gap-3">
                    <img
                      src={githubData.avatar_url}
                      alt={githubData.login}
                      className="w-10 h-10 rounded-full border border-border object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-foreground">{githubData.name || githubData.login}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">@{githubData.login}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono tabular-nums mt-0.5">
                        <span>{githubData.public_repos} repos</span>
                        <span>•</span>
                        <span>{githubData.followers} followers</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setGithubInput(githubUsername);
                        setIsEditingGithub(true);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent"
                      title="Switch GitHub Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={githubData.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Short Contribution Heatmap */}
                <div className="p-3 rounded-xl bg-secondary/20 border border-border overflow-x-auto">
                  <div className="min-w-[500px]">
                    <img
                      src={`https://ghchart.rshah.org/00f2fe/${githubData.login}`}
                      alt={`${githubData.login}'s Contribution Chart`}
                      className="w-full h-auto dark:invert dark:hue-rotate-180"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-1.5 border-t border-border/50 font-mono">
                    <span>12-Month Contribution Timeline</span>
                    <span>Active Developer Heatmap</span>
                  </div>
                </div>

                {/* Compact Recent Repositories */}
                {githubRepos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {githubRepos.map((repo) => (
                      <a
                        key={repo.id}
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-secondary/30 border border-border hover:border-primary/40 transition-colors block no-underline group"
                      >
                        <div className="text-[12px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {repo.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground font-mono tabular-nums">
                          {repo.language && <span>{repo.language}</span>}
                          <span>★ {repo.stargazers_count}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── CHESS.COM SECTION ─── */}
        {activeTab === "chess" && (
          <div className="space-y-4">
            {(!chessUsername || isEditingChess) ? (
              <div className="p-4 rounded-xl border border-dashed border-border bg-secondary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Connect your Chess.com Profile</span>
                  </div>
                  {chessUsername && (
                    <button
                      onClick={() => setIsEditingChess(false)}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Enter your Chess.com handle to fetch real-time Rapid, Blitz, Bullet ratings and win ratios.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchChess(chessInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={chessInput}
                    onChange={(e) => setChessInput(e.target.value)}
                    placeholder="e.g. hikaru or your username"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-background border border-border text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={chessLoading}
                    className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer border-none"
                  >
                    {chessLoading ? "Loading..." : "Connect"}
                  </button>
                </form>
              </div>
            ) : null}

            {chessError && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chessError}</span>
              </div>
            )}

            {chessUser && (
              <div className="space-y-3">
                {/* Identity Header */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                  <div className="flex items-center gap-3">
                    {chessUser.avatar ? (
                      <img
                        src={chessUser.avatar}
                        alt={chessUser.username}
                        className="w-10 h-10 rounded-xl border border-border object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-border flex items-center justify-center text-amber-500 font-bold text-sm">
                        ♟
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {chessUser.title && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-destructive text-destructive-foreground text-[9px] font-bold uppercase">
                            {chessUser.title}
                          </span>
                        )}
                        <span className="text-[14px] font-semibold text-foreground">{chessUser.name || chessUser.username}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">@{chessUser.username}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Verified Chess.com Player Profile</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setChessInput(chessUsername);
                        setIsEditingChess(true);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent"
                      title="Switch Chess.com Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={chessUser.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="View on Chess.com"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Ratings Grid */}
                {chessStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rapid</span>
                      <div className="text-[20px] font-bold font-mono tabular-nums text-emerald-500 dark:text-emerald-400 mt-0.5">
                        {chessStats.chess_rapid?.last?.rating || "N/A"}
                      </div>
                      <div className="text-[10px] font-mono tabular-nums text-muted-foreground">
                        Peak: {chessStats.chess_rapid?.best?.rating || "—"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blitz</span>
                      <div className="text-[20px] font-bold font-mono tabular-nums text-amber-500 dark:text-amber-400 mt-0.5">
                        {chessStats.chess_blitz?.last?.rating || "N/A"}
                      </div>
                      <div className="text-[10px] font-mono tabular-nums text-muted-foreground">
                        Peak: {chessStats.chess_blitz?.best?.rating || "—"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bullet</span>
                      <div className="text-[20px] font-bold font-mono tabular-nums text-sky-500 dark:text-cyan-400 mt-0.5">
                        {chessStats.chess_bullet?.last?.rating || "N/A"}
                      </div>
                      <div className="text-[10px] font-mono tabular-nums text-muted-foreground">
                        Peak: {chessStats.chess_bullet?.best?.rating || "—"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-secondary/30 border border-border text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tactics</span>
                      <div className="text-[20px] font-bold font-mono tabular-nums text-purple-500 dark:text-purple-400 mt-0.5">
                        {chessStats.tactics?.highest?.rating || "N/A"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Puzzle Rating</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperActivityCard;
