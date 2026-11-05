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

            <h1 className="text-[clamp(3rem,9vw,5.5rem)] font-black text-primary m-0 leading-[1.1] uppercase transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_0_20px_rgba(2,132,199,0.25)] dark:drop-shadow-[0_0_25px_rgba(0,242,254,0.35)]">
              Skill Sphere
            </h1>

            <p className="text-[clamp(1.1rem,3vw,1.75rem)] text-muted-foreground mt-3 mb-6 font-normal tracking-wide">
              Learn • Enjoy • Grow
            </p>

            {/* Quick Action Navigation Bar */}
            <div className="flex flex-col items-center gap-3 w-full max-w-md">
              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                {/* 1. Open Dashboard Primary Button */}
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/25 hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all no-underline cursor-pointer border-none"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </Link>

                {/* 2. Quizzes & Duels Secondary Button */}
                <Link
                  to="/quizzes"
                  className="px-5 py-2.5 rounded-xl bg-card/80 hover:bg-card text-foreground border border-border backdrop-blur-md font-semibold text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all no-underline shadow-xs cursor-pointer"
                >
                  <Swords className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Quizzes & Duels</span>
                </Link>
              </div>

              {/* 3. Friends & Chat Tertiary Button */}
              <Link
                to="/friends"
                className="px-5 py-2.5 rounded-xl bg-card/80 hover:bg-card text-foreground border border-border backdrop-blur-md font-semibold text-xs flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all no-underline shadow-xs cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Friends & Chat</span>
              </Link>
            </div>
          </div>
        </DynamicWallpaper>
      </div>
    </div>
  );
};

export default HomePage;
