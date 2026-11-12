import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import DynamicWallpaper from '../components/DynamicWallpaper';

export const HomePage: React.FC = () => {
  const [fullName, setFullName] = useState<string>(() => {
    const user = auth.currentUser;
    return user?.displayName?.split(" ")[0] || "Developer";
  });
  const [displayName, setDisplayName] = useState<string>(() => {
    const user = auth.currentUser;
    return user?.displayName || "Developer";
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 22) return "Good Evening";
    return "Good Night";
  };

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        if (currentUser.displayName) {
          setDisplayName(currentUser.displayName);
        }
        if (currentUser.uid === "test-user-123") {
          const local = localStorage.getItem("skillsphere_dev_profile");
          if (local) {
            try {
              const data = JSON.parse(local);
              if (data.name) {
                setFullName(data.name.split(" ")[0]);
                setDisplayName(data.name);
                return;
              }
            } catch (e) {}
          }
          setFullName("Developer");
          setDisplayName("Developer");
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const full = (userDoc.data().name as string) || currentUser.displayName || "Developer";
            const firstName = full.trim().split(" ")[0];
            setFullName(firstName);
            setDisplayName(full);
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
          {/* Time-based Greeting & User Welcome */}
          <div className="flex-1 flex flex-col items-center justify-start pt-20 sm:pt-24 text-center p-6 select-none z-10 pointer-events-none">
            <div className="backdrop-blur-md px-6 py-3.5 rounded-2xl bg-black/40 border border-white/15 shadow-2xl animate-in fade-in duration-500">
              <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight m-0 drop-shadow-lg">
                {getGreeting()}, {fullName}
              </h1>
              <p className="text-white/80 text-xs sm:text-sm font-normal mt-0.5 m-0 drop-shadow-md">
                Welcome {displayName}
              </p>
            </div>
          </div>
        </DynamicWallpaper>
      </div>
    </div>
  );
};

export default HomePage;
