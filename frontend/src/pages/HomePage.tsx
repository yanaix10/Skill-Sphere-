import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import HomeSidebar from '../components/HomeSidebar';
import DynamicWallpaper from '../components/DynamicWallpaper';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomePage: React.FC = () => {
  const [fullName, setFullName] = useState<string>("User");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem("skillsphere_home_sidebar") !== "false";
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("skillsphere_home_sidebar", String(next));
      return next;
    });
  };

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        if (currentUser.uid === "test-user-123") {
          setFullName("TestAgent");
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
    <div className="h-full w-full flex bg-background overflow-hidden text-foreground transition-colors duration-200 relative">
      {/* Collapsible Left Sidebar */}
      <HomeSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Main Wallpaper & Content Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <DynamicWallpaper>
          {/* Top Bar with Sidebar Reveal Button when collapsed */}
          {!isSidebarOpen && (
            <div className="absolute top-3 left-4 z-30 animate-in fade-in slide-in-from-left-2 duration-200">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="gap-2 shadow-sm border-border bg-card/90 backdrop-blur-md text-foreground hover:bg-card hover:border-primary/50 text-xs font-semibold cursor-pointer"
                title="Show Dashboard Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-primary shrink-0" />
                <span>Dashboard</span>
              </Button>
            </div>
          )}

          {/* Central Hero Branding */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 overflow-auto select-none">
            <h2 className="text-foreground/80 dark:text-foreground/90 text-xl font-semibold mb-2 tracking-wide">
              Welcome {fullName}
            </h2>
            <h1 className="text-[clamp(3rem,10vw,5.5rem)] font-black text-primary m-0 leading-[1.1] uppercase transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_0_20px_rgba(2,132,199,0.25)] dark:drop-shadow-[0_0_25px_rgba(0,242,254,0.35)]">
              Skill Sphere <br />
            </h1>
            <p className="text-[clamp(1.5rem,4vw,2.2rem)] text-foreground/75 dark:text-muted-foreground mt-5 mb-10 font-normal tracking-wide">
              Learn • Enjoy • Grow
            </p>
          </div>
        </DynamicWallpaper>
      </div>
    </div>
  );
};

export default HomePage;
