import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileDialog from '@/components/ui/profile-dialog';
import {
  Award,
  Code2,
  Zap,
  Shield,
  Flame,
  Crown,
  Trophy,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { getRankTier, ACHIEVEMENT_BADGES } from '@/utils/ranks';
import { cn } from '@/lib/utils';

interface ProfileData {
  name?: string;
  username?: string;
  degree?: string;
  branch?: string;
  age?: string | number;
  homeCity?: string;
  collegeName?: string;
  year?: string | number;
  about?: string;
  bannerUrl?: string;
  avatarUrl?: string;
  rating?: number;
  points?: number;
  quizzesCompleted?: number;
  quizzesPerfect?: number;
  duelsWon?: number;
  duelsLost?: number;
  duelsPlayed?: number;
  winStreak?: number;
  badges?: string[];
}

interface ProfileViewProps {
  data?: ProfileData | null;
  userId?: string | null;
  onEdit?: () => void;
}

const renderTierIcon = (iconName: string, className?: string) => {
  switch (iconName) {
    case 'Crown':
      return <Crown className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Code2':
      return <Code2 className={className} />;
    case 'Award':
    default:
      return <Award className={className} />;
  }
};

const ProfileView: React.FC<ProfileViewProps> = ({ data, userId, onEdit }) => {
  const [userData, setUserData] = useState<ProfileData | null>(data || null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (data) {
      setUserData(data);
    }
  }, [data]);

  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      const updated = e.detail;
      const currentUid = auth.currentUser?.uid;
      if (updated && (userId === currentUid || !userId)) {
        setUserData((prev) => ({ ...prev, ...updated }));
      }
    };
    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('profile-updated', handleProfileUpdated);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    if (userId === 'test-user-123') {
      const local = localStorage.getItem('skillsphere_dev_profile');
      if (local) {
        try {
          setUserData(JSON.parse(local));
          return;
        } catch (e) {}
      }
    }

    // Subscribe to live Firestore user document for instant avatar/banner updates
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (userDoc) => {
        if (userDoc.exists()) {
          setUserData(userDoc.data() as ProfileData);
        } else {
          setUserData({
            name: 'Soul Honest',
            username: 'soul_honest',
            degree: 'B.Com in Management',
            age: 22,
            homeCity: 'Sitapur',
            collegeName: 'VIT Chennai',
            year: 1,
            about: 'Moj Masti Padhai',
            rating: 600,
            points: 600,
            badges: [],
          });
        }
      },
      (error) => {
        console.error('Error subscribing to profile:', error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  if (!userData) {
    return (
      <aside className="w-full h-full bg-card border-l border-border flex items-center justify-center text-muted-foreground p-6 text-sm">
        Loading Profile...
      </aside>
    );
  }

  const tier = getRankTier(userData.rating || 600);
  const userBadges = Array.isArray(userData.badges) ? userData.badges : [];
  const badgeKeys = Object.keys(ACHIEVEMENT_BADGES);

  return (
    <aside className="w-full h-full bg-card border-l border-border flex flex-col overflow-y-auto text-card-foreground select-none">
      {/* Banner Cover - full width */}
      <div className="h-32 w-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 relative shrink-0 border-b border-border/40">
        {userData.bannerUrl && (
          <img
            src={userData.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Avatar & User Header */}
      <div className="px-6 relative pb-6 flex-1 flex flex-col">
        <div className="absolute -top-10 left-6">
          <Avatar className="size-20 rounded-full border-4 border-card bg-secondary shadow-md">
            {userData.avatarUrl && <AvatarImage src={userData.avatarUrl} alt={userData.name || 'User'} />}
            <AvatarFallback className="text-xl font-bold bg-secondary text-foreground">
              {(userData.name || userData.username || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-12 space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground truncate max-w-[200px]">
              {userData.name || 'User Name'}
            </h2>
            <div
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 border shrink-0"
              style={{
                borderColor: `${tier.color}40`,
                backgroundColor: tier.bgLight,
                color: tier.color,
              }}
            >
              {renderTierIcon(tier.iconName, 'size-3')}
              <span>{tier.name}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            @{userData.username || 'username'}
          </p>
          {userData.degree && (
            <p className="text-xs text-muted-foreground/80 italic pt-0.5">
              {userData.degree} {userData.branch ? `in ${userData.branch}` : ''}
            </p>
          )}
        </div>

        {/* Rank & Rating Progression Card */}
        <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Current Standing
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">
                  {tier.name} <span className="text-xs font-normal text-muted-foreground">({tier.title})</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono text-primary tabular-nums">
                {tier.rating} <span className="text-[10px] font-normal text-muted-foreground">Rating</span>
              </span>
              <span className="block text-[10px] text-muted-foreground font-mono">
                {userData.points || tier.rating} XP
              </span>
            </div>
          </div>

          {/* Progress bar to next tier */}
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>Progress</span>
              <span>
                {tier.nextTier ? `${tier.toNextTier} pts to ${tier.nextTier.name}` : 'Top Tier Reached'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border/80">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${tier.progressInTier}%`,
                  backgroundColor: tier.color,
                }}
              />
            </div>
          </div>

          {/* Battle Stats Summary */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60">
            <div className="text-center p-1.5 rounded-lg bg-secondary/50">
              <span className="block text-[10px] text-muted-foreground uppercase">Quizzes</span>
              <span className="text-xs font-bold text-foreground">
                {userData.quizzesCompleted || 0}
              </span>
            </div>
            <div className="text-center p-1.5 rounded-lg bg-secondary/50">
              <span className="block text-[10px] text-muted-foreground uppercase">Duels</span>
              <span className="text-xs font-bold text-foreground">
                {userData.duelsWon || 0}W / {(userData.duelsPlayed || 0) - (userData.duelsWon || 0)}L
              </span>
            </div>
            <div className="text-center p-1.5 rounded-lg bg-secondary/50">
              <span className="block text-[10px] text-muted-foreground uppercase">Streak</span>
              <span className="text-xs font-bold text-amber-500">
                🔥 {userData.winStreak || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Achievement Badges Showcase */}
        <div className="mt-3.5 rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Badges & Milestones
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {userBadges.length} / {badgeKeys.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {badgeKeys.map((key) => {
              const badge = ACHIEVEMENT_BADGES[key];
              const isUnlocked = userBadges.includes(key);

              return (
                <div
                  key={key}
                  className={cn(
                    'p-2 rounded-lg border text-left transition-all flex flex-col justify-between gap-1 min-h-[58px]',
                    isUnlocked
                      ? 'bg-card border-border shadow-xs'
                      : 'bg-secondary/20 border-border/40 opacity-60'
                  )}
                  title={badge.description}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{badge.icon}</span>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-foreground leading-tight truncate">
                      {badge.name}
                    </span>
                    <span className="block text-[9px] text-muted-foreground truncate leading-tight">
                      {isUnlocked ? 'Unlocked' : badge.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal & Campus Details Card */}
        <div className="mt-3.5 rounded-xl border border-border bg-secondary/30 p-3.5 space-y-3">
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Personal Details
            </span>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">Age</span>
              <span className="font-medium text-foreground">{userData.age || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">Home City</span>
              <span className="font-medium text-foreground">{userData.homeCity || 'N/A'}</span>
            </div>
          </div>

          <div className="border-t border-border/60 pt-3 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Education
            </span>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">College</span>
              <span className="font-medium text-foreground truncate max-w-[160px] text-right">
                {userData.collegeName || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">Year</span>
              <span className="font-medium text-foreground">{userData.year || 'N/A'}</span>
            </div>
          </div>

          {userData.about && (
            <div className="border-t border-border/60 pt-3 space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                About Campus
              </span>
              <p className="text-xs text-muted-foreground italic leading-relaxed m-0">
                "{userData.about}"
              </p>
            </div>
          )}
        </div>

        {/* Single Edit Profile Button docked nicely */}
        <div className="mt-auto pt-5">
          <Button
            variant="outline"
            className="w-full text-xs font-semibold border-border hover:bg-secondary hover:text-foreground"
            onClick={() => {
              if (onEdit) onEdit();
              else setIsProfileOpen(true);
            }}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </aside>
  );
};

export default ProfileView;
