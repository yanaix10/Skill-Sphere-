import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import DynamicWallpaper from '../components/DynamicWallpaper';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Swords, Users, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          {/* Central Hero Branding & Quick Actions */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 overflow-auto select-none z-10">
            <h2 className="text-foreground/80 dark:text-foreground/90 text-lg sm:text-xl font-semibold mb-2 tracking-wide">
              Welcome {fullName}
            </h2>

            <h1 className="text-[clamp(3rem,9vw,5.5rem)] font-black text-primary m-0 leading-[1.1] uppercase transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_0_20px_rgba(2,132,199,0.25)] dark:drop-shadow-[0_0_25px_rgba(0,242,254,0.35)]">
              Skill Sphere <br />
            </h1>

            <p className="text-[clamp(1.2rem,3.5vw,2rem)] text-foreground/75 dark:text-muted-foreground mt-4 mb-8 font-normal tracking-wide">
              Learn • Enjoy • Grow
            </p>

            {/* Main Action Hub */}
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-md w-full">
              <Button
                asChild
                size="lg"
                className="px-6 py-6 rounded-2xl bg-primary text-primary-foreground font-bold text-sm tracking-wide shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                <Link to="/dashboard" className="flex items-center gap-2.5 no-underline">
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-5 py-6 rounded-2xl border-border bg-card/80 backdrop-blur-md text-foreground font-semibold text-sm hover:bg-card hover:border-primary/50 transition-all duration-200 cursor-pointer"
              >
                <Link to="/quizzes" className="flex items-center gap-2 no-underline">
                  <Swords className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Quizzes & Duels</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-5 py-6 rounded-2xl border-border bg-card/80 backdrop-blur-md text-foreground font-semibold text-sm hover:bg-card hover:border-primary/50 transition-all duration-200 cursor-pointer"
              >
                <Link to="/friends" className="flex items-center gap-2 no-underline">
                  <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Friends & Chat</span>
                </Link>
              </Button>
            </div>
          </div>
        </DynamicWallpaper>
      </div>
    </div>
  );
};

export default HomePage;
