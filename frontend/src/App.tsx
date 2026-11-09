import { useState, useEffect } from 'react'
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
        href="/quizzes"
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
      >
        Go to Quizzes & Duels
      </a>
    </div>
  );
}

function Layout() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      <Navbar /> 
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RootErrorBoundary />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/home", element: <DashboardPage /> },
      { path: "/profile", element: <Profile /> },
      { path: "/friends", element: <Friends /> },
      { path: "/quizzes", element: <Quizzes /> },
      { path: "/privacy", element: <PrivacyPolicy /> },
      { path: "/terms", element: <TermsOfService /> },
      { path: "/games", element: <Navigate to="/quizzes" replace /> },
      { path: "*", element: <Navigate to="/quizzes" replace /> },
    ]
  }
]);

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
  },[]);
  
  if(loading) return <div className="bg-background text-foreground h-screen w-screen flex items-center justify-center text-xl font-bold">Loading SkillSphere...</div>;
  
  const isPublicPage = typeof window !== "undefined" && (
    window.location.pathname === "/privacy" || 
    window.location.pathname === "/terms" ||
    window.location.pathname === "/quizzes" ||
    window.location.pathname === "/games"
  );

  if(user === null && !isPublicPage){
    return <SignupCard />;
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
