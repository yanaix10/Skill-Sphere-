import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import DynamicWallpaper from '../components/DynamicWallpaper';

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
          {/* Central Hero Branding */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 overflow-auto select-none z-10">
            <h2 className="text-foreground/80 dark:text-foreground/90 text-lg sm:text-xl font-semibold mb-2 tracking-wide">
              Welcome {fullName}
            </h2>

            <h1 className="text-[clamp(3rem,9vw,5.5rem)] font-black text-primary m-0 leading-[1.1] uppercase transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_0_20px_rgba(2,132,199,0.25)] dark:drop-shadow-[0_0_25px_rgba(0,242,254,0.35)]">
              Skill Sphere <br />
            </h1>

            <p className="text-[clamp(1.2rem,3.5vw,2rem)] text-foreground/75 dark:text-muted-foreground mt-4 mb-2 font-normal tracking-wide">
              Learn • Enjoy • Grow
            </p>
          </div>
        </DynamicWallpaper>
      </div>
    </div>
  );
};

export default HomePage;
