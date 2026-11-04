import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { getRankTier, ACHIEVEMENT_BADGES } from "@/utils/ranks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Award, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoderUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  collegeName?: string;
  rating: number;
  points: number;
  badges: string[];
  isCurrentUser?: boolean;
}

// Fallback baseline competitors so the leaderboard is never blank if DB has few users
const BENCHMARK_CODERS: Omit<CoderUser, "id">[] = [
  {
    name: "Aarav Sharma",
    username: "aarav_algo",
    collegeName: "IIT Delhi",
    rating: 2450,
    points: 2450,
    badges: ["bullseye", "first_blood", "hot_streak"],
  },
  {
    name: "Ishani Roy",
    username: "ishani_codes",
    collegeName: "BITS Pilani",
    rating: 1980,
    points: 1980,
    badges: ["first_blood", "polyglot"],
  },
  {
    name: "Karan Verma",
    username: "karan_v",
    collegeName: "NIT Trichy",
    rating: 1620,
    points: 1620,
    badges: ["bullseye", "first_blood"],
  },
  {
    name: "Mehak Kaur",
    username: "mehak_tech",
    collegeName: "DTU Delhi",
    rating: 1250,
    points: 1250,
    badges: ["first_blood"],
  },
  {
    name: "Rohan Gupta",
    username: "rohan_g",
    collegeName: "VIT Vellore",
    rating: 940,
    points: 940,
    badges: ["bullseye"],
  },
  {
    name: "Sanya Patel",
    username: "sanya_p",
    collegeName: "IIIT Hyderabad",
    rating: 720,
    points: 720,
    badges: [],
  },
];

const Coders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [coders, setCoders] = useState<CoderUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;

    const readLocalDevUser = (): CoderUser | null => {
      try {
        const local = localStorage.getItem("skillsphere_dev_profile");
        if (local) {
          const parsed = JSON.parse(local);
          return {
            id: currentUid || "test-user-123",
            name: parsed.name || auth.currentUser?.displayName || "You (Dev)",
            username: parsed.username || "dev_user",
            avatarUrl: parsed.avatarUrl || auth.currentUser?.photoURL || undefined,
            collegeName: parsed.collegeName || "SkillSphere Campus",
            rating: typeof parsed.rating === "number" ? parsed.rating : 600,
            points: typeof parsed.points === "number" ? parsed.points : 600,
            badges: Array.isArray(parsed.badges) ? parsed.badges : [],
            isCurrentUser: true,
          };
        }
      } catch (e) {
        console.warn("Could not read local dev profile:", e);
      }
      return null;
    };

    // Live subscription to Firestore users collection
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const firestoreUsers: CoderUser[] = [];
        const seenIds = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const uid = docSnap.id;
          seenIds.add(uid);

          const isMe = uid === currentUid;
          firestoreUsers.push({
            id: uid,
            name: data.name || data.displayName || "Coder " + uid.slice(0, 4),
            username: data.username || "coder_" + uid.slice(0, 5),
            avatarUrl: data.avatarUrl || data.photoURL || undefined,
            collegeName: data.collegeName || "",
            rating: typeof data.rating === "number" ? data.rating : 600,
            points: typeof data.points === "number" ? data.points : 600,
            badges: Array.isArray(data.badges) ? data.badges : [],
            isCurrentUser: isMe,
          });
        });

        // Ensure current dev user is always included if running locally
        const devUser = readLocalDevUser();
        if (devUser) {
          const idx = firestoreUsers.findIndex((u) => u.id === devUser.id);
          if (idx !== -1) {
            firestoreUsers[idx] = { ...firestoreUsers[idx], ...devUser, isCurrentUser: true };
          } else {
            firestoreUsers.push(devUser);
          }
        }

        // Merge baseline competitors if pool is small
        const finalPool = [...firestoreUsers];
        BENCHMARK_CODERS.forEach((bench, i) => {
          const benchId = `benchmark_${i + 1}`;
          if (!finalPool.some((u) => u.name === bench.name)) {
            finalPool.push({
              ...bench,
              id: benchId,
              isCurrentUser: false,
            });
          }
        });

        // Sort descending by rating (or points)
        finalPool.sort((a, b) => b.rating - a.rating);
        setCoders(finalPool);
        setLoading(false);
      },
      (error) => {
        console.warn("Firestore coders listener error, falling back to local:", error);
        const devUser = readLocalDevUser();
        const fallbackList: CoderUser[] = BENCHMARK_CODERS.map((b, i) => ({
          ...b,
          id: `bench_${i}`,
        }));
        if (devUser) {
          fallbackList.push(devUser);
        }
        fallbackList.sort((a, b) => b.rating - a.rating);
        setCoders(fallbackList);
        setLoading(false);
      }
    );

    const onProfileUpdate = () => {
      const devUser = readLocalDevUser();
      if (devUser) {
        setCoders((prev) => {
          const updated = [...prev];
          const idx = updated.findIndex((u) => u.id === devUser.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], ...devUser, isCurrentUser: true };
          } else {
            updated.push(devUser);
          }
          return updated.sort((a, b) => b.rating - a.rating);
        });
      }
    };

    window.addEventListener("profile-updated", onProfileUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("profile-updated", onProfileUpdate);
    };
  }, []);

  const filteredCoders = coders.filter((coder) => {
    const q = searchTerm.toLowerCase();
    return (
      coder.name.toLowerCase().includes(q) ||
      coder.username.toLowerCase().includes(q) ||
      (coder.collegeName && coder.collegeName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-card text-card-foreground h-full flex flex-col p-3 font-sans box-border select-none">
      {/* Search & Header */}
      <div className="pb-3 border-b border-border space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="m-0 text-xs font-bold uppercase tracking-wider text-foreground">
              Coders Leaderboard
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {coders.length} Active
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search coders or campus..."
            className="w-full pl-8 pr-3 py-1.5 bg-secondary text-foreground border border-border rounded-lg outline-none text-xs focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground/60"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="overflow-y-auto grow flex flex-col gap-1.5 pt-2.5 pr-0.5">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading active coders...
          </div>
        ) : filteredCoders.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No coders found matching "{searchTerm}"
          </div>
        ) : (
          filteredCoders.map((coder, index) => {
            const tier = getRankTier(coder.rating);
            const rankPosition = index + 1;

            return (
              <div
                key={coder.id}
                className={cn(
                  "p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2.5",
                  coder.isCurrentUser
                    ? "bg-primary/10 border-primary/40 shadow-xs ring-1 ring-primary/20"
                    : "bg-secondary/40 border-border/80 hover:bg-secondary/80 hover:border-border"
                )}
              >
                {/* Left: Rank #, Avatar & Name info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Position Badge */}
                  <div className="w-5 text-center shrink-0">
                    {rankPosition === 1 ? (
                      <span className="text-amber-500 font-black text-xs">🥇</span>
                    ) : rankPosition === 2 ? (
                      <span className="text-slate-400 font-black text-xs">🥈</span>
                    ) : rankPosition === 3 ? (
                      <span className="text-amber-700 font-black text-xs">🥉</span>
                    ) : (
                      <span className="text-[11px] font-mono font-bold text-muted-foreground">
                        #{rankPosition}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="size-8 rounded-full border border-border shrink-0">
                    {coder.avatarUrl && <AvatarImage src={coder.avatarUrl} alt={coder.name} />}
                    <AvatarFallback className="text-xs font-bold bg-secondary text-foreground">
                      {coder.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name & Handle */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-bold text-foreground truncate">
                        {coder.name}
                      </span>
                      {coder.isCurrentUser && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-primary text-primary-foreground">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                      <span>@{coder.username}</span>
                      {coder.collegeName && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[80px]">{coder.collegeName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Rank Badge & Rating */}
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  <div
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border"
                    style={{
                      borderColor: `${tier.color}40`,
                      backgroundColor: tier.bgLight,
                      color: tier.color,
                    }}
                  >
                    <span>{tier.name}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-foreground tabular-nums">
                    {coder.rating} <span className="text-[10px] font-normal text-muted-foreground">pts</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Coders;
