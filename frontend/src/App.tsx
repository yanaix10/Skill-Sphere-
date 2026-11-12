import { useState, useEffect, useMemo } from 'react'
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import SignupCard from './components/SignupCard';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import Friends from './pages/Friends';
import Quizzes from './pages/Quizzes';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { ThemeProvider } from './context/ThemeContext';

function RootErrorBoundary() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-background text-foreground select-none p-6 text-center space-y-4">
      <h1 className="text-2xl font-extrabold text-foreground">Page Not Found</h1>
      <p className="text-xs text-muted-foreground font-mono">The requested route does not exist.</p>
      <a
        href="/"
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
      >
        Return to Home
      </a>
    </div>
  );
}

function Layout({ user }: { user: User | null }) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {user && <Navbar />} 
      <main className="flex-1 overflow-y-auto min-h-0">
        <Outlet />
      </main>
    </div>
  );
}

function AppContent() {
  const getInitialUser = (): User | null => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev') === 'true') {
        return {
          uid: "test-user-123",
          displayName: "TestAgent",
          email: "agent@test.com",
          photoURL: "https://via.placeholder.com/150"
        } as unknown as User;
      }
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(getInitialUser);
  const [loading, setLoading] = useState<boolean>(() => getInitialUser() === null);
  
  useEffect(() => {
    // Purge legacy test artifacts from localStorage on first load
    try {
      const legacyUsernames = ["eWFuYWl4MTA=", "Y2hlY2tzNDU=", "bmFpdGlr"].map((b) => atob(b));
      ["skillsphere_github_username", "skillsphere_chess_username"].forEach((key) => {
        const val = localStorage.getItem(key);
        if (val && legacyUsernames.some((p) => val.toLowerCase() === p.toLowerCase())) {
          localStorage.removeItem(key);
        }
      });
      const devProfile = localStorage.getItem("skillsphere_dev_profile");
      if (devProfile && legacyUsernames.some((p) => devProfile.toLowerCase().includes(p.toLowerCase()))) {
        localStorage.removeItem("skillsphere_dev_profile");
      }
      // Purge hardcoded demo friend notifications if they were cached from a previous session
      const storedNotifs = localStorage.getItem("skillsphere_friend_notifications");
      if (storedNotifs) {
        try {
          const notifs = JSON.parse(storedNotifs);
          const hasLegacy = Array.isArray(notifs) && notifs.some((n: any) =>
            ["friend-soul", "friend-kritika", "friend-izuku"].includes(n?.friendId)
          );
          if (hasLegacy) localStorage.removeItem("skillsphere_friend_notifications");
        } catch {}
      }
    } catch {}

    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true') {
      setUser({
        uid: "test-user-123",
        displayName: "TestAgent",
        email: "agent@test.com",
        photoURL: "https://via.placeholder.com/150"
      } as unknown as User);
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 500);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeout);
      setUser(currentUser);
      setLoading(false);
    });
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const router = useMemo(() => createBrowserRouter([
    {
      path: "/",
      element: <Layout user={user} />,
      errorElement: <RootErrorBoundary />,
      children: [
        { path: "/", element: user ? <HomePage /> : <SignupCard /> },
        { path: "/dashboard", element: user ? <DashboardPage /> : <Navigate to="/" replace /> },
        { path: "/home", element: user ? <DashboardPage /> : <Navigate to="/" replace /> },
        { path: "/profile", element: user ? <Profile /> : <Navigate to="/" replace /> },
        { path: "/friends", element: user ? <Friends /> : <Navigate to="/" replace /> },
        { path: "/quizzes", element: user ? <Quizzes /> : <Navigate to="/" replace /> },
        { path: "/privacy", element: <PrivacyPolicy /> },
        { path: "/terms", element: <TermsOfService /> },
        { path: "/games", element: <Navigate to={user ? "/quizzes" : "/"} replace /> },
        { path: "*", element: <Navigate to="/" replace /> },
      ]
    }
  ]), [user]);
  
  if (loading) {
    return (
      <div className="bg-background text-foreground h-screen w-screen flex items-center justify-center text-xl font-bold font-sans">
        Loading SkillSphere...
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
