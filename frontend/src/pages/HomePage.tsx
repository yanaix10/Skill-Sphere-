import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import DynamicWallpaper from '../components/DynamicWallpaper';
import { LayoutDashboard, Swords, Users, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [fullName, setFullName] = useState<string>("User");

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        if (currentUser.uid === "test-user-123") {
          const local = localStorage.getItem("skillsphere_dev_profile");
          if (local) {
            try {
              const data = JSON.parse(local);
              if (data.name) {
                setFullName(data.name.split(" ")[0]);
                return;
              }
            } catch (e) {}
          }
          setFullName("Naitik");
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const fullDisplayName = userDoc.data().name as string;
            const firstName = fullDisplayName.trim().split(" ")[0];
            setFullName(firstName);
          }
        } catch (e) {
          console.warn("Could not fetch user name for home:", e);
        }
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="h-full w-full flex bg-background overflow-hidden text-foreground relative">
      {/* Full Screen Dynamic Wallpaper Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <DynamicWallpaper>
          {/* Central Hero Branding & Action Launchpad */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 overflow-auto select-none z-10">
            <h2 className="text-foreground text-lg sm:text-xl font-semibold mb-2 tracking-wide">
              Welcome {fullName}
            </h2>

            <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-bold tracking-tight text-foreground m-0">
              SkillSphere
            </h1>

            <p className="text-[15px] sm:text-[17px] text-muted-foreground mt-2 mb-6 font-normal">
              Learn • Enjoy • Grow
            </p>

            {/* Quick Action Navigation Bar */}
            <div className="flex flex-col items-center gap-2.5 w-full max-w-md">
              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
                {/* 1. Open Dashboard Primary Button */}
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-[13px] flex items-center gap-2 shadow-xs hover:opacity-95 active:scale-95 transition-all no-underline cursor-pointer border-none"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Open dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>

                {/* 2. Quizzes & Duels Secondary Button */}
                <Link
                  to="/quizzes"
                  className="px-4 py-2 rounded-md bg-card hover:bg-surface-muted text-foreground border border-border font-medium text-[13px] flex items-center gap-2 active:scale-95 transition-all no-underline shadow-xs cursor-pointer"
                >
                  <Swords className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>Quizzes & duels</span>
                </Link>
              </div>

              {/* 3. Friends & Chat Tertiary Button */}
              <Link
                to="/friends"
                className="px-4 py-2 rounded-md bg-card hover:bg-surface-muted text-foreground border border-border font-medium text-[13px] flex items-center gap-2 active:scale-95 transition-all no-underline shadow-xs cursor-pointer"
              >
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Friends & chat</span>
              </Link>
            </div>
          </div>
        </DynamicWallpaper>
      </div>
    </div>
  );
};

export default HomePage;
