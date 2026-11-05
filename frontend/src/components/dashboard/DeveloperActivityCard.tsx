import React, { useState, useEffect } from "react";
import {
  Trophy,
  ExternalLink,
  RefreshCw,
  Search,
  Star,
  GitFork,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Swords,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  country?: string;
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
  // GitHub State
  const [githubUsername, setGithubUsername] = useState<string>(() => {
    return localStorage.getItem("skillsphere_github_username") || "torvalds";
  });
  const [githubInput, setGithubInput] = useState(githubUsername);
  const [githubData, setGithubData] = useState<GitHubUser | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Chess.com State
  const [chessUsername, setChessUsername] = useState<string>(() => {
    return localStorage.getItem("skillsphere_chess_username") || "hikaru";
  });
  const [chessInput, setChessInput] = useState(chessUsername);
  const [chessUser, setChessUser] = useState<ChessUser | null>(null);
  const [chessStats, setChessStats] = useState<ChessStats | null>(null);
  const [chessLoading, setChessLoading] = useState(false);
  const [chessError, setChessError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"github" | "chess">("github");

  /* ─── Fetch GitHub Data ─── */
  const fetchGithub = async (username: string) => {
    if (!username.trim()) return;
    setGithubLoading(true);
    setGithubError(null);
    try {
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username.trim())}`);
      if (!userRes.ok) {
        if (userRes.status === 404) throw new Error("GitHub user not found");
        throw new Error("Could not load GitHub profile");
      }
      const userData: GitHubUser = await userRes.json();
      setGithubData(userData);

      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username.trim())}/repos?sort=updated&per_page=4`
      );
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        if (Array.isArray(reposData)) {
          setGithubRepos(reposData);
        }
      }
      localStorage.setItem("skillsphere_github_username", username.trim());
      setGithubUsername(username.trim());
    } catch (err: any) {
      setGithubError(err.message || "Failed to fetch GitHub");
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
    } catch (err: any) {
      setChessError(err.message || "Failed to fetch Chess.com");
    } finally {
      setChessLoading(false);
    }
  };

  useEffect(() => {
    fetchGithub(githubUsername);
    fetchChess(chessUsername);
  }, []);

  const handleSearchGithub = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGithub(githubInput);
  };

  const handleSearchChess = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChess(chessInput);
  };

  return (
    <div className="w-full rounded-2xl bg-card border border-border overflow-hidden shadow-xs text-foreground transition-colors">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border bg-secondary/30 gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Developer & Gaming Activity
          </h3>
          <p className="text-xs text-muted-foreground">
            Live metrics from your GitHub repositories and Chess.com rating history
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/70 border border-border shrink-0">
          <button
            onClick={() => setActiveTab("github")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none",
              activeTab === "github"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            )}
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab("chess")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none",
              activeTab === "chess"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            )}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Chess.com</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* ─── GITHUB SECTION ─── */}
        {activeTab === "github" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search Input Bar */}
            <form onSubmit={handleSearchGithub} className="flex gap-2">
              <div className="relative flex-1">
                <GithubIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                  placeholder="Enter GitHub username (e.g. torvalds)..."
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={githubLoading}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer border-none"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{githubLoading ? "Loading..." : "Load"}</span>
              </button>
            </form>

            {githubError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{githubError}</span>
              </div>
            )}

            {githubData && (
              <div className="space-y-6">
                {/* Profile Overview Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={githubData.avatar_url}
                      alt={githubData.login}
                      className="w-14 h-14 rounded-full border-2 border-border shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground text-base">{githubData.name || githubData.login}</h4>
                        <span className="text-xs text-muted-foreground font-mono">@{githubData.login}</span>
                      </div>
                      {githubData.bio && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-md line-clamp-2">{githubData.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-center px-3 py-1.5 rounded-lg bg-card border border-border">
                      <div className="text-xs font-mono font-bold text-foreground">{githubData.public_repos}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Repos</div>
                    </div>
                    <div className="text-center px-3 py-1.5 rounded-lg bg-card border border-border">
                      <div className="text-xs font-mono font-bold text-foreground">{githubData.followers}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Followers</div>
                    </div>
                    <a
                      href={githubData.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Contribution Activity Chart Matrix */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <GitFork className="w-3.5 h-3.5 text-emerald-500" />
                      Annual Contribution Heatmap
                    </h4>
                    <span className="text-[11px] text-muted-foreground font-mono">Activity Graph</span>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/20 border border-border overflow-x-auto">
                    <div className="min-w-[640px]">
                      {/* GitHub Public Chart Embed or Fallback matrix */}
                      <img
                        src={`https://ghchart.rshah.org/10b981/${githubData.login}`}
                        alt={`${githubData.login}'s GitHub Contribution Chart`}
                        className="w-full h-auto rounded-sm filter dark:invert dark:hue-rotate-180"
                        onError={(e) => {
                          // Fallback to stylized grid if external CDN is blocked
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/60">
                      <span>Recent 12 Months Contributions</span>
                      <div className="flex items-center gap-1.5">
                        <span>Less</span>
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-900/30" />
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600/50" />
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
                        <span>More</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Repositories */}
                {githubRepos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Featured Repositories
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {githubRepos.map((repo) => (
                        <a
                          key={repo.id}
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3.5 rounded-xl bg-secondary/30 border border-border hover:border-primary/50 transition-all block group no-underline"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                              <GitFork className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{repo.name}</span>
                            </span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground shrink-0" />
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground font-mono">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitFork className="w-3 h-3" />
                              {repo.forks_count}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── CHESS.COM SECTION ─── */}
        {activeTab === "chess" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search Input Bar */}
            <form onSubmit={handleSearchChess} className="flex gap-2">
              <div className="relative flex-1">
                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input
                  type="text"
                  value={chessInput}
                  onChange={(e) => setChessInput(e.target.value)}
                  placeholder="Enter Chess.com username (e.g. hikaru, magnuscarlsen)..."
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={chessLoading}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/90 transition-colors cursor-pointer border-none"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{chessLoading ? "Loading..." : "Load"}</span>
              </button>
            </form>

            {chessError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{chessError}</span>
              </div>
            )}

            {chessUser && (
              <div className="space-y-6">
                {/* Chess User Profile Overview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border gap-4">
                  <div className="flex items-center gap-3.5">
                    {chessUser.avatar ? (
                      <img
                        src={chessUser.avatar}
                        alt={chessUser.username}
                        className="w-14 h-14 rounded-xl border-2 border-border shadow-xs object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 border-2 border-border flex items-center justify-center text-amber-500 font-bold text-lg">
                        ♟
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        {chessUser.title && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-destructive text-destructive-foreground text-[10px] font-extrabold tracking-wider">
                            {chessUser.title}
                          </span>
                        )}
                        <h4 className="font-bold text-foreground text-base">{chessUser.name || chessUser.username}</h4>
                        <span className="text-xs text-muted-foreground font-mono">@{chessUser.username}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Official Chess.com Player Profile
                      </p>
                    </div>
                  </div>

                  <a
                    href={chessUser.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border text-xs font-semibold self-start sm:self-auto no-underline"
                  >
                    <span>View on Chess.com</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Ratings Grid */}
                {chessStats && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      Current Ratings & Game Records
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Rapid */}
                      <div className="p-3.5 rounded-xl bg-secondary/30 border border-border">
                        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                          <span className="font-semibold uppercase tracking-wider text-[10px]">Rapid</span>
                          <span className="text-[10px] font-mono">Best: {chessStats.chess_rapid?.best?.rating || "N/A"}</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-emerald-500">
                          {chessStats.chess_rapid?.last?.rating || "Unrated"}
                        </div>
                        {chessStats.chess_rapid?.record && (
                          <div className="text-[10px] text-muted-foreground mt-1 flex gap-2 font-mono">
                            <span className="text-emerald-500 font-bold">{chessStats.chess_rapid.record.win}W</span>
                            <span className="text-muted-foreground">{chessStats.chess_rapid.record.draw}D</span>
                            <span className="text-destructive font-bold">{chessStats.chess_rapid.record.loss}L</span>
                          </div>
                        )}
                      </div>

                      {/* Blitz */}
                      <div className="p-3.5 rounded-xl bg-secondary/30 border border-border">
                        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                          <span className="font-semibold uppercase tracking-wider text-[10px]">Blitz</span>
                          <span className="text-[10px] font-mono">Best: {chessStats.chess_blitz?.best?.rating || "N/A"}</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-amber-500">
                          {chessStats.chess_blitz?.last?.rating || "Unrated"}
                        </div>
                        {chessStats.chess_blitz?.record && (
                          <div className="text-[10px] text-muted-foreground mt-1 flex gap-2 font-mono">
                            <span className="text-emerald-500 font-bold">{chessStats.chess_blitz.record.win}W</span>
                            <span className="text-muted-foreground">{chessStats.chess_blitz.record.draw}D</span>
                            <span className="text-destructive font-bold">{chessStats.chess_blitz.record.loss}L</span>
                          </div>
                        )}
                      </div>

                      {/* Bullet */}
                      <div className="p-3.5 rounded-xl bg-secondary/30 border border-border">
                        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                          <span className="font-semibold uppercase tracking-wider text-[10px]">Bullet</span>
                          <span className="text-[10px] font-mono">Best: {chessStats.chess_bullet?.best?.rating || "N/A"}</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-cyan-500">
                          {chessStats.chess_bullet?.last?.rating || "Unrated"}
                        </div>
                        {chessStats.chess_bullet?.record && (
                          <div className="text-[10px] text-muted-foreground mt-1 flex gap-2 font-mono">
                            <span className="text-emerald-500 font-bold">{chessStats.chess_bullet.record.win}W</span>
                            <span className="text-muted-foreground">{chessStats.chess_bullet.record.draw}D</span>
                            <span className="text-destructive font-bold">{chessStats.chess_bullet.record.loss}L</span>
                          </div>
                        )}
                      </div>

                      {/* Tactics / Puzzles */}
                      <div className="p-3.5 rounded-xl bg-secondary/30 border border-border">
                        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                          <span className="font-semibold uppercase tracking-wider text-[10px]">Puzzles</span>
                          <span className="text-[10px] font-mono">Peak</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-purple-500">
                          {chessStats.tactics?.highest?.rating || "N/A"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">Tactics Rating</div>
                      </div>
                    </div>

                    {/* Win / Loss / Draw Visual Ratio Bar */}
                    {chessStats.chess_rapid?.record && (
                      <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-2">
                        {(() => {
                          const w = chessStats.chess_rapid!.record.win;
                          const d = chessStats.chess_rapid!.record.draw;
                          const l = chessStats.chess_rapid!.record.loss;
                          const total = w + d + l || 1;
                          const winPct = Math.round((w / total) * 100);
                          const drawPct = Math.round((d / total) * 100);
                          const lossPct = 100 - winPct - drawPct;

                          return (
                            <>
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-foreground">Rapid Performance Distribution</span>
                                <span className="font-mono text-muted-foreground">{total} Total Games</span>
                              </div>
                              <div className="w-full h-3 rounded-full bg-secondary overflow-hidden flex">
                                <div style={{ width: `${winPct}%` }} className="bg-emerald-500 h-full" title={`Wins: ${winPct}%`} />
                                <div style={{ width: `${drawPct}%` }} className="bg-zinc-400 h-full" title={`Draws: ${drawPct}%`} />
                                <div style={{ width: `${lossPct}%` }} className="bg-destructive h-full" title={`Losses: ${lossPct}%`} />
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                                <span className="text-emerald-500 font-bold">{winPct}% Won ({w})</span>
                                <span className="text-muted-foreground font-bold">{drawPct}% Draw ({d})</span>
                                <span className="text-destructive font-bold">{lossPct}% Lost ({l})</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
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
