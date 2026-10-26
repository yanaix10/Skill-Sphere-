import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sun, Moon } from "lucide-react";
import ProfileDialog from "@/components/ui/profile-dialog";
import { useTheme } from "../context/ThemeContext";

const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/games", label: "Games" },
  { href: "/friends", label: "Friends" },
];

export default function Navbar() {
  const [fullName, setFullName] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
                setFullName(data.name);
                return;
              }
            } catch (e) {}
          }
          setFullName("Naitik Yadav");
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setFullName(userDoc.data().name as string);
          }
        } catch (error) {
          console.error("Error fetching user name:", error);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("skillsphere_dev_auth");
    signOut(auth);
    navigate("/");
  };

  const currentUser = auth.currentUser;

  return (
    <>
      <header className="border-b border-border bg-card px-4 md:px-6 shrink-0 transition-colors duration-200">
        <div className="flex h-16 justify-between items-center gap-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center md:hidden">
              {/* Mobile menu trigger */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="group size-8" variant="ghost" size="icon">
                    <svg
                      className="pointer-events-none"
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path
                        d="M4 12L20 12"
                        className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                      />
                      <path
                        d="M4 12H20"
                        className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                      />
                      <path
                        d="M4 12H20"
                        className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                      />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-40 p-2 md:hidden bg-card border-border">
                  <NavigationMenu className="max-w-none *:w-full">
                    <NavigationMenuList className="flex-col items-start gap-1">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          <Link
                            to={link.href}
                            className="block py-1.5 px-3 rounded text-sm text-muted-foreground hover:text-primary hover:bg-secondary no-underline"
                          >
                            {link.label}
                          </Link>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            </div>

            {/* Logo */}
            <Link to="/" className="text-primary hover:text-primary/90 font-bold text-xl no-underline tracking-tight">
              SkillSphere
            </Link>

            {/* Desktop Navigation menu from navbar.txt */}
            <NavigationMenu className="max-md:hidden">
              <NavigationMenuList className="gap-2">
                {navigationLinks.map((link, index) => (
                  <NavigationMenuItem key={index}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary border-b-2 border-transparent hover:border-b-primary px-3 py-2 font-medium transition-colors text-sm no-underline"
                    >
                      {link.label}
                    </Link>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side - User actions & Theme Toggle docked to the right */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </Button>

            {currentUser ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-foreground hover:text-primary"
                  onClick={() => setIsProfileOpen(true)}
                >
                  {fullName || currentUser.displayName || "My Profile"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-sm">
                  <Link to="/">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="text-sm bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </>
  );
}
