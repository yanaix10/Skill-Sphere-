import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileDialog from '@/components/ui/profile-dialog';

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
}

interface ProfileViewProps {
  data?: ProfileData | null;
  userId?: string | null;
  onEdit?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ data, userId, onEdit }) => {
  const [userData, setUserData] = useState<ProfileData | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (data) {
        setUserData(data);
        return;
      }
      if (userId) {
        if (userId === "test-user-123") {
          const local = localStorage.getItem("skillsphere_dev_profile");
          if (local) {
            try {
              setUserData(JSON.parse(local));
              return;
            } catch (e) {}
          }
        }
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as ProfileData);
          } else {
            setUserData({
              name: "Soul Honest",
              username: "soul_honest",
              degree: "B.Com in Management",
              age: 22,
              homeCity: "Sitapur",
              collegeName: "VIT Chennai",
              year: 1,
              about: "Moj Masti Padhai",
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };
    fetchProfile();
  }, [userId, data]);

  if (!userData) {
    return (
      <aside className="w-full h-full bg-card border-l border-border flex items-center justify-center text-muted-foreground p-6 text-sm">
        Loading Profile...
      </aside>
    );
  }

  return (
    <aside className="w-full h-full bg-card border-l border-border flex flex-col overflow-y-auto text-card-foreground">
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
            {userData.avatarUrl && <AvatarImage src={userData.avatarUrl} alt={userData.name || "User"} />}
            <AvatarFallback className="text-xl font-bold bg-secondary text-foreground">
              {(userData.name || userData.username || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-12 space-y-1">
          <h2 className="text-base font-bold text-foreground truncate">
            {userData.name || "User Name"}
          </h2>
          <p className="text-xs text-muted-foreground">
            @{userData.username || "username"}
          </p>
          {userData.degree && (
            <p className="text-xs text-muted-foreground/80 italic pt-0.5">
              {userData.degree} {userData.branch ? `in ${userData.branch}` : ""}
            </p>
          )}
        </div>

        {/* Details Card */}
        <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3.5 space-y-3">
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Personal Details
            </span>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">Age</span>
              <span className="font-medium text-foreground">{userData.age || "N/A"}</span>
            </div>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">Home City</span>
              <span className="font-medium text-foreground">{userData.homeCity || "N/A"}</span>
            </div>
          </div>

          <div className="border-t border-border/60 pt-3 space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Education
            </span>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">College</span>
              <span className="font-medium text-foreground truncate max-w-[160px] text-right">
                {userData.collegeName || "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">Year</span>
              <span className="font-medium text-foreground">{userData.year || "N/A"}</span>
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
