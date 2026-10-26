import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const HomePage: React.FC = () => {
  const [fullName, setFullName] = useState<string>("User");

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Handle dev bypass user mock
        if (currentUser.uid === "test-user-123") {
          setFullName("TestAgent");
          return;
        }
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const fullDisplayName = userDoc.data().name as string;
          const firstName = fullDisplayName.trim().split(" ")[0];
          setFullName(firstName);
        }
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden text-foreground transition-colors duration-200">
      <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
        <h2 className="text-muted-foreground text-xl font-medium mb-2">Welcome {fullName}</h2>
        <h1 className="text-[clamp(3rem,10vw,5.5rem)] font-black text-primary m-0 leading-[1.1] uppercase transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_0_15px_rgba(2,132,199,0.25)] dark:drop-shadow-[0_0_15px_rgba(0,242,254,0.3)]">
          Skill Sphere <br />
        </h1>
        <p className="text-[clamp(1.5rem,4vw,2.2rem)] text-muted-foreground mt-5 mb-10 font-normal">Learn • Enjoy • Grow</p>
      </div>
    </div>
  );
};

export default HomePage;
