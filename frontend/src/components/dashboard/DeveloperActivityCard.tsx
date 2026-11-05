import React, { useState, useEffect } from "react";
import { GitHubCalendar } from "react-github-calendar";
import {
  Trophy,
  ExternalLink,
  Search,
  Star,
  GitFork,
  AlertCircle,
  TrendingUp,
  Edit2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";

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
  const { resolvedTheme } = useTheme();

  // GitHub State
  const [githubUsername, setGithubUsername] = useState<string>(() => {
    return localStorage.getItem("skillsphere_github_username") || "yanaix10";
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
      let savedGh = localStorage.getItem("skillsphere_github_username") || "yanaix10";
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
        `https://api.github.com/users/${encodeURIComponent(username.trim())}/repos?sort=updated&per_page=6`
      );
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        if (Array.isArray(reposData)) {
          // Filter out user's profile README repo (repo name matches username) and keep top 3 active repos
          const filtered = reposData
            .filter((r: GitHubRepo) => r.name.toLowerCase() !== username.trim().toLowerCase())
            .slice(0, 3);
          setGithubRepos(filtered);
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
    <div className="w-full rounded-xl bg-card border border-border overflow-hidden shadow-xs text-foreground transition-colors">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border bg-surface-muted/40 gap-3">
        <h3 className="text-[16px] font-semibold text-foreground flex items-center gap-2 m-0">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span>Developer activity</span>
        </h3>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-surface-muted border border-border shrink-0">
          <button
            onClick={() => setActiveTab("github")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded text-[13px] font-medium transition-all cursor-pointer border-none",
              activeTab === "github"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            )}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab("chess")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded text-[13px] font-medium transition-all cursor-pointer border-none",
              activeTab === "chess"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            )}
          >
            <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Chess.com</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* ─── GITHUB SECTION ─── */}
        {activeTab === "github" && (
          <div className="space-y-4">
            {(!githubUsername || isEditingGithub) ? (
              <div className="p-4 rounded-lg border border-dashed border-border bg-surface-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                    <GithubIcon className="w-4 h-4 text-primary" />
                    <span>Connect your GitHub account</span>
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
                    placeholder="Enter GitHub username"
                    className="flex-1 px-3 py-1.5 rounded-md bg-background border border-border text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <button
                    type="submit"
                    disabled={githubLoading}
                    className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-95 transition-all cursor-pointer border-none"
                  >
                    {githubLoading ? "Loading..." : "Connect"}
                  </button>
                </form>
              </div>
            ) : null}

            {githubError && (
              <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-[13px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{githubError}</span>
              </div>
            )}

            {githubData && (
              <div className="space-y-3.5">
                {/* Identity Bar */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    <img
                      src={githubData.avatar_url}
                      alt={githubData.login}
                      className="w-10 h-10 rounded-full border border-border object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-foreground">
                          {githubData.name || githubData.login}
                        </span>
                        <span className="text-[12px] text-muted-foreground font-mono">
                          @{githubData.login}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground font-mono tabular-nums mt-0.5">
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
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer border-none bg-transparent"
                      title="Switch GitHub account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={githubData.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* React GitHub Calendar Heatmap (Real Component, Zero Image Hacks) */}
                <div className="p-4 rounded-lg bg-surface-muted/20 border border-border overflow-x-auto flex justify-center">
                  <GitHubCalendar
                    username={githubData.login}
                    blockSize={11}
                    blockMargin={3}
                    fontSize={12}
                    colorScheme={resolvedTheme === "dark" ? "dark" : "light"}
                    theme={{
                      light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
                      dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
                    }}
                  />
                </div>

                {/* Filtered Recent Repositories */}
                {githubRepos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {githubRepos.map((repo) => (
                      <a
                        key={repo.id}
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-surface-muted/30 border border-border hover:border-primary/50 transition-colors block no-underline group"
                      >
                        <div className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate font-mono">
                          {repo.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground font-mono tabular-nums">
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
              <div className="p-4 rounded-lg border border-dashed border-border bg-surface-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <span>Connect your Chess.com profile</span>
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
                    placeholder="Enter Chess.com username"
                    className="flex-1 px-3 py-1.5 rounded-md bg-background border border-border text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <button
                    type="submit"
                    disabled={chessLoading}
                    className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-95 transition-all cursor-pointer border-none"
                  >
                    {chessLoading ? "Loading..." : "Connect"}
                  </button>
                </form>
              </div>
            ) : null}

            {chessError && (
              <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-[13px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chessError}</span>
              </div>
            )}

            {chessUser && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    {chessUser.avatar ? (
                      <img
                        src={chessUser.avatar}
                        alt={chessUser.username}
                        className="w-10 h-10 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-surface-muted border border-border flex items-center justify-center text-foreground font-semibold text-sm">
                        ♟
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {chessUser.title && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-destructive text-destructive-foreground text-[10px] font-bold font-mono uppercase">
                            {chessUser.title}
                          </span>
                        )}
                        <span className="text-[14px] font-semibold text-foreground">
                          {chessUser.name || chessUser.username}
                        </span>
                        <span className="text-[12px] text-muted-foreground font-mono">
                          @{chessUser.username}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setChessInput(chessUsername);
                        setIsEditingChess(true);
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer border-none bg-transparent"
                      title="Switch Chess.com account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={chessUser.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
                      title="View on Chess.com"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Ratings Grid */}
                {chessStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-lg bg-surface-muted/30 border border-border text-center">
                      <span className="text-[12px] font-medium text-muted-foreground">Rapid</span>
                      <div className="text-[22px] font-semibold font-mono tabular-nums text-foreground mt-0.5">
                        {chessStats.chess_rapid?.last?.rating || "—"}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-muted-foreground">
                        Peak: {chessStats.chess_rapid?.best?.rating || "—"}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-muted/30 border border-border text-center">
                      <span className="text-[12px] font-medium text-muted-foreground">Blitz</span>
                      <div className="text-[22px] font-semibold font-mono tabular-nums text-foreground mt-0.5">
                        {chessStats.chess_blitz?.last?.rating || "—"}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-muted-foreground">
                        Peak: {chessStats.chess_blitz?.best?.rating || "—"}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-muted/30 border border-border text-center">
                      <span className="text-[12px] font-medium text-muted-foreground">Bullet</span>
                      <div className="text-[22px] font-semibold font-mono tabular-nums text-foreground mt-0.5">
                        {chessStats.chess_bullet?.last?.rating || "—"}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-muted-foreground">
                        Peak: {chessStats.chess_bullet?.best?.rating || "—"}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-muted/30 border border-border text-center">
                      <span className="text-[12px] font-medium text-muted-foreground">Tactics</span>
                      <div className="text-[22px] font-semibold font-mono tabular-nums text-foreground mt-0.5">
                        {chessStats.tactics?.highest?.rating || "—"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">Puzzle rating</div>
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
