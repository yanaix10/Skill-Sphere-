import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import HomeSidebar, { SidebarSection } from "../components/HomeSidebar";
import Overview from "../components/dashboard/Overview";
import Media from "../components/dashboard/Media";
import Todos from "../components/dashboard/Todos";
import Jobs from "../components/dashboard/Jobs";
import Classroom from "../components/dashboard/Classroom";
import Calendar from "../components/dashboard/Calendar";
import Settings from "../components/dashboard/Settings";
import DeveloperActivityCard from "../components/dashboard/DeveloperActivityCard";
import SavedPosts from "../components/dashboard/SavedPosts";
import GlassWorkspace from "../components/dashboard/GlassWorkspace";
import { PanelLeftOpen, LayoutDashboard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DashboardPage: React.FC = () => {
  const [fullName, setFullName] = useState<string>("User");
  const [activeSection, setActiveSection] = useState<SidebarSection>(() => {
    try {
      const saved = localStorage.getItem("skillsphere_active_section") as SidebarSection;
      return saved || "overview";
    } catch {
      return "overview";
    }
  });

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

  const navigate = useNavigate();

  const handleSelectSection = (section: SidebarSection) => {
    setActiveSection(section);
    try {
      localStorage.setItem("skillsphere_active_section", section);
    } catch {}
  };

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
          setFullName(currentUser.displayName?.split(" ")[0] || "User");
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const fullDisplayName = (userDoc.data().name as string) || currentUser.displayName || "User";
            const firstName = fullDisplayName.trim().split(" ")[0];
            setFullName(firstName);
          }
        } catch (e) {
          console.warn("Could not fetch user name:", e);
        }
      }
    };
    fetchUser();
  }, []);

  const getSectionTitle = (sec: SidebarSection) => {
    switch (sec) {
      case "overview":
        return "Overview";
      case "saved":
        return "Saved Posts";
      case "media":
        return "Media & Resources";
      case "todo":
        return "To-Do Tasks";
      case "jobs":
        return "Job Applications";
      case "classroom":
        return "Google Classroom";
      case "calendar":
        return "Google Calendar";
      case "activity":
        return "Developer Activity";
      case "settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="h-full w-full flex bg-background text-foreground overflow-hidden">
      {/* Left Navigation Sidebar */}
      <HomeSidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
      />

      {/* Main Right Big Area Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-secondary/10">
        {/* Top Mini Header / Breadcrumb */}
        <div className="h-14 px-4 sm:px-6 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <span>{getSectionTitle(activeSection)}</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Scrollable Main Content Pane */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeSection === "overview" && (
            <div className="animate-in fade-in duration-200">
              <Overview userName={fullName} onNavigate={handleSelectSection} />
            </div>
          )}

          {activeSection === "saved" && (
            <div className="animate-in fade-in duration-200">
              <SavedPosts />
            </div>
          )}

          {activeSection === "media" && (
            <div className="animate-in fade-in duration-200">
              <Media />
            </div>
          )}

          {activeSection === "todo" && (
            <div className="animate-in fade-in duration-200">
              <Todos />
            </div>
          )}

          {activeSection === "jobs" && (
            <div className="animate-in fade-in duration-200">
              <Jobs />
            </div>
          )}

          {activeSection === "classroom" && (
            <div className="animate-in fade-in duration-200">
              <Classroom />
            </div>
          )}

          {activeSection === "calendar" && (
            <div className="animate-in fade-in duration-200">
              <Calendar />
            </div>
          )}

          {activeSection === "activity" && (
            <div className="animate-in fade-in duration-200 max-w-5xl mx-auto">
              <GlassWorkspace brand="SkillSphere" useHostTheme={true}>
                <DeveloperActivityCard />
              </GlassWorkspace>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="animate-in fade-in duration-200">
              <Settings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

