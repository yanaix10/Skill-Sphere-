import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface RankTier {
  name: string;
  title: string;
  minRating: number;
  maxRating: number;
  color: string;
  bgLight: string;
  textColor: string;
  iconName: "Award" | "Code2" | "Zap" | "Shield" | "Flame" | "Crown";
}

export const RANK_TIERS: RankTier[] = [
  {
    name: "Bronze",
    title: "Novice",
    minRating: 0,
    maxRating: 499,
    color: "#CD7F32",
    bgLight: "rgba(205, 127, 50, 0.15)",
    textColor: "#CD7F32",
    iconName: "Award",
  },
  {
    name: "Silver",
    title: "Apprentice",
    minRating: 500,
    maxRating: 999,
    color: "#94A3B8",
    bgLight: "rgba(148, 163, 184, 0.15)",
    textColor: "#94A3B8",
    iconName: "Code2",
  },
  {
    name: "Gold",
    title: "Warrior",
    minRating: 1000,
    maxRating: 1799,
    color: "#F59E0B",
    bgLight: "rgba(245, 158, 11, 0.15)",
    textColor: "#F59E0B",
    iconName: "Zap",
  },
  {
    name: "Platinum",
    title: "Knight",
    minRating: 1800,
    maxRating: 2799,
    color: "#06B6D4",
    bgLight: "rgba(6, 182, 212, 0.15)",
    textColor: "#06B6D4",
    iconName: "Shield",
  },
  {
    name: "Diamond",
    title: "Master",
    minRating: 2800,
    maxRating: 3999,
    color: "#A855F7",
    bgLight: "rgba(168, 85, 247, 0.15)",
    textColor: "#A855F7",
    iconName: "Flame",
  },
  {
    name: "Grandmaster",
    title: "Legend",
    minRating: 4000,
    maxRating: Infinity,
    color: "#EC4899",
    bgLight: "rgba(236, 72, 153, 0.15)",
    textColor: "#EC4899",
    iconName: "Crown",
  },
];

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "quiz" | "duel" | "mastery";
}

export const ACHIEVEMENT_BADGES: Record<string, BadgeDefinition> = {
  bullseye: {
    id: "bullseye",
    name: "Bullseye",
    description: "Score 100% accuracy in a Practice Quiz session",
    icon: "🎯",
    category: "quiz",
  },
  speed_demon: {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Pass all challenge test cases in under 90s",
    icon: "⚡",
    category: "duel",
  },
  first_blood: {
    id: "first_blood",
    name: "First Blood",
    description: "Win your first 1v1 Arena Duel",
    icon: "⚔️",
    category: "duel",
  },
  hot_streak: {
    id: "hot_streak",
    name: "Hot Streak",
    description: "Win 3 consecutive 1v1 duels",
    icon: "🔥",
    category: "duel",
  },
  polyglot: {
    id: "polyglot",
    name: "Polyglot",
    description: "Compete in both Web Dev and DSA duel tracks",
    icon: "🌐",
    category: "mastery",
  },
  quizmaster: {
    id: "quizmaster",
    name: "Quizmaster",
    description: "Complete 10 or more MCQ practice quiz sessions",
    icon: "🧠",
    category: "quiz",
  },
};

export interface UserStats {
  rating: number;
  points: number;
  quizzesCompleted: number;
  quizzesPerfect: number;
  duelsWon: number;
  duelsLost: number;
  duelsPlayed: number;
  winStreak: number;
  bestWinStreak: number;
  tracksPlayed: string[];
  badges: string[];
}

export const DEFAULT_USER_STATS: UserStats = {
  rating: 600,
  points: 600,
  quizzesCompleted: 0,
  quizzesPerfect: 0,
  duelsWon: 0,
  duelsLost: 0,
  duelsPlayed: 0,
  winStreak: 0,
  bestWinStreak: 0,
  tracksPlayed: [],
  badges: [],
};

export function getRankTier(rating: number = 0) {
  const safeRating = Math.max(0, Math.floor(rating || 0));
  const tier =
    RANK_TIERS.find((t) => safeRating >= t.minRating && safeRating <= t.maxRating) ||
    RANK_TIERS[0];

  const currentFloor = tier.minRating;
  const currentCeil = tier.maxRating === Infinity ? 5000 : tier.maxRating;
  const range = Math.max(1, currentCeil - currentFloor);
  const progressInTier = Math.min(
    100,
    Math.max(0, Math.round(((safeRating - currentFloor) / range) * 100))
  );

  const tierIndex = RANK_TIERS.indexOf(tier);
  const nextTier = tierIndex < RANK_TIERS.length - 1 ? RANK_TIERS[tierIndex + 1] : null;
  const toNextTier = nextTier ? Math.max(0, nextTier.minRating - safeRating) : 0;

  return {
    ...tier,
    rating: safeRating,
    progressInTier,
    nextTier,
    toNextTier,
  };
}

export interface UpdateUserStatsParams {
  pointsDelta?: number;
  ratingDelta?: number;
  quizCompleted?: boolean;
  quizPerfect?: boolean;
  duelWon?: boolean;
  duelLost?: boolean;
  duelDraw?: boolean;
  track?: "webdev_arena" | "dsa_sprint";
  solveDurationSeconds?: number;
}

export interface UpdateUserStatsResult {
  newStats: UserStats;
  newBadgesUnlocked: BadgeDefinition[];
}

export async function updateUserStatsAndBadges(
  params: UpdateUserStatsParams
): Promise<UpdateUserStatsResult> {
  const user = auth.currentUser;
  const isDevUser = user?.uid === "test-user-123" || !user;

  let currentProfile: any = {};

  if (isDevUser) {
    try {
      const local = localStorage.getItem("skillsphere_dev_profile");
      if (local) currentProfile = JSON.parse(local);
    } catch (e) {
      console.warn("Could not parse local dev profile:", e);
    }
  } else if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        currentProfile = snap.data();
      }
    } catch (err) {
      console.warn("Could not read current user profile from Firestore:", err);
    }
  }

  const existingStats: UserStats = {
    rating: typeof currentProfile.rating === "number" ? currentProfile.rating : DEFAULT_USER_STATS.rating,
    points: typeof currentProfile.points === "number" ? currentProfile.points : DEFAULT_USER_STATS.points,
    quizzesCompleted: currentProfile.quizzesCompleted || 0,
    quizzesPerfect: currentProfile.quizzesPerfect || 0,
    duelsWon: currentProfile.duelsWon || 0,
    duelsLost: currentProfile.duelsLost || 0,
    duelsPlayed: currentProfile.duelsPlayed || 0,
    winStreak: currentProfile.winStreak || 0,
    bestWinStreak: currentProfile.bestWinStreak || 0,
    tracksPlayed: Array.isArray(currentProfile.tracksPlayed) ? currentProfile.tracksPlayed : [],
    badges: Array.isArray(currentProfile.badges) ? currentProfile.badges : [],
  };

  const newPoints = Math.max(0, existingStats.points + (params.pointsDelta || 0));
  const newRating = Math.max(0, existingStats.rating + (params.ratingDelta || 0));

  let quizzesCompleted = existingStats.quizzesCompleted;
  let quizzesPerfect = existingStats.quizzesPerfect;
  if (params.quizCompleted) quizzesCompleted += 1;
  if (params.quizPerfect) quizzesPerfect += 1;

  let duelsWon = existingStats.duelsWon;
  let duelsLost = existingStats.duelsLost;
  let duelsPlayed = existingStats.duelsPlayed;
  let winStreak = existingStats.winStreak;
  let bestWinStreak = existingStats.bestWinStreak;

  if (params.duelWon) {
    duelsWon += 1;
    duelsPlayed += 1;
    winStreak += 1;
    if (winStreak > bestWinStreak) bestWinStreak = winStreak;
  } else if (params.duelLost) {
    duelsLost += 1;
    duelsPlayed += 1;
    winStreak = 0;
  } else if (params.duelDraw) {
    duelsPlayed += 1;
  }

  const tracksSet = new Set(existingStats.tracksPlayed);
  if (params.track) tracksSet.add(params.track);
  const tracksPlayed = Array.from(tracksSet);

  // Evaluate badge criteria
  const currentBadgesSet = new Set(existingStats.badges);
  const newlyUnlocked: BadgeDefinition[] = [];

  const grantBadge = (badgeId: string) => {
    if (!currentBadgesSet.has(badgeId) && ACHIEVEMENT_BADGES[badgeId]) {
      currentBadgesSet.add(badgeId);
      newlyUnlocked.push(ACHIEVEMENT_BADGES[badgeId]);
    }
  };

  if (params.quizPerfect) grantBadge("bullseye");
  if (quizzesCompleted >= 10) grantBadge("quizmaster");
  if (duelsWon >= 1) grantBadge("first_blood");
  if (winStreak >= 3) grantBadge("hot_streak");
  if (tracksPlayed.includes("webdev_arena") && tracksPlayed.includes("dsa_sprint")) {
    grantBadge("polyglot");
  }
  if (params.solveDurationSeconds && params.solveDurationSeconds <= 90) {
    grantBadge("speed_demon");
  }

  const newBadges = Array.from(currentBadgesSet);

  const updatedStats: UserStats = {
    rating: newRating,
    points: newPoints,
    quizzesCompleted,
    quizzesPerfect,
    duelsWon,
    duelsLost,
    duelsPlayed,
    winStreak,
    bestWinStreak,
    tracksPlayed,
    badges: newBadges,
  };

  const payloadToSave = {
    ...currentProfile,
    ...updatedStats,
  };

  if (isDevUser) {
    localStorage.setItem("skillsphere_dev_profile", JSON.stringify(payloadToSave));
  } else if (user) {
    try {
      await setDoc(doc(db, "users", user.uid), payloadToSave, { merge: true });
    } catch (e) {
      console.error("Error saving updated user stats to Firestore:", e);
    }
  }

  // Broadcast change across app
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("profile-updated", { detail: payloadToSave }));
  }

  return {
    newStats: updatedStats,
    newBadgesUnlocked: newlyUnlocked,
  };
}

