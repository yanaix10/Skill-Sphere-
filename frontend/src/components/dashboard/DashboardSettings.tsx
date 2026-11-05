import React, { useState } from "react";
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Check,
  Bell,
  Volume2,
  Sliders,
  User,
  Shield,
  Palette,
  Mountain,
  Waves,
  Trees,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../../context/ThemeContext";
import { auth } from "../../firebase";
import ProfileDialog from "@/components/ui/profile-dialog";

export const DashboardSettings: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Wallpaper preferences
  const [wallpaperScene, setWallpaperScene] = useState<string>(() => {
    return localStorage.getItem("skillsphere_wallpaper_scene") || "mountains";
  });
  const [particlesEnabled, setParticlesEnabled] = useState<boolean>(() => {
    return localStorage.getItem("skillsphere_particles_enabled") !== "false";
  });

  // Notifications
  const [notifyDuels, setNotifyDuels] = useState(true);
  const [notifyAssignments, setNotifyAssignments] = useState(true);
  const [notifyCalendar, setNotifyCalendar] = useState(true);

  const currentUser = auth.currentUser;

  const handleSceneChange = (scene: string) => {
    setWallpaperScene(scene);
    localStorage.setItem("skillsphere_wallpaper_scene", scene);
  };

  const handleParticlesToggle = () => {
    setParticlesEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("skillsphere_particles_enabled", String(next));
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-foreground">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h2 className="text-[24px] font-semibold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-primary" />
          Settings & Preferences
        </h2>
        <p className="text-[12px] text-[#94A3B8] mt-1">
          Customize your SkillSphere appearance, theme, dynamic wallpaper engine, and integrations
        </p>
      </div>

      {/* ─── Appearance & Theme Section ─── */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs space-y-3.5">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E2E8F0] flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Theme & Appearance
          </h3>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">
            Select your preferred color scheme. Light mode is standardized with high contrast pitch black text.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light Theme Card */}
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "p-3.5 rounded-xl border text-left transition-all cursor-pointer relative shadow-xs flex flex-col justify-between h-24",
              theme === "light"
                ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                : "border-border bg-card hover:bg-secondary/40"
            )}
          >
            <div className="flex items-center justify-between">
              <Sun className="w-4 h-4 text-amber-500" />
              {theme === "light" && <Check className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[#E2E8F0]">Standard Light</div>
              <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Pitch black #000000 text</div>
            </div>
          </button>

          {/* Dark Theme Card */}
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "p-3.5 rounded-xl border text-left transition-all cursor-pointer relative shadow-xs flex flex-col justify-between h-24",
              theme === "dark"
                ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                : "border-border bg-card hover:bg-secondary/40"
            )}
          >
            <div className="flex items-center justify-between">
              <Moon className="w-4 h-4 text-blue-400" />
              {theme === "dark" && <Check className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[#E2E8F0]">Midnight Dark</div>
              <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Deep black & cyan glow</div>
            </div>
          </button>

          {/* System Theme Card */}
          <button
            onClick={() => setTheme("system")}
            className={cn(
              "p-3.5 rounded-xl border text-left transition-all cursor-pointer relative shadow-xs flex flex-col justify-between h-24",
              theme === "system"
                ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                : "border-border bg-card hover:bg-secondary/40"
            )}
          >
            <div className="flex items-center justify-between">
              <Laptop className="w-4 h-4 text-muted-foreground" />
              {theme === "system" && <Check className="w-4 h-4 text-primary" />}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[#E2E8F0]">System Default</div>
              <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Syncs with OS ({resolvedTheme})</div>
            </div>
          </button>
        </div>
      </div>

      {/* ─── Wallpaper Engine Settings ─── */}
      <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-xs space-y-3.5">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E2E8F0] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            Dynamic Wallpaper Engine
          </h3>
          <p className="text-[12px] text-[#94A3B8] mt-0.5">
            Configure the 3D procedural landscape scenes and meteorological particle simulation
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleSceneChange("mountains")}
            className={cn(
              "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3",
              wallpaperScene === "mountains"
                ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                : "border-border bg-card hover:bg-secondary/40"
            )}
          >
            <Mountain className="w-4 h-4 text-primary" />
            <div>
              <div className="text-[14px] font-semibold text-[#E2E8F0]">Alpine Mountains</div>
              <div className="text-[12px] text-[#94A3B8]">High elevation ridge</div>
            </div>
          </button>

          <button
            onClick={() => handleSceneChange("beaches")}
            className={cn(
              "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3",
              wallpaperScene === "beaches"
                ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                : "border-border bg-card hover:bg-secondary/40"
            )}
          >
            <Waves className="w-5 h-5 text-cyan-500" />
            <div>
              <div className="text-xs font-bold text-foreground">Coastal Beach</div>
              <div className="text-[10px] text-muted-foreground">Ocean waves & tide</div>
            </div>
          </button>

          <button
            onClick={() => handleSceneChange("plains")}
            className={cn(
              "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3",
              wallpaperScene === "plains"
                ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                : "border-border bg-card hover:bg-secondary/40"
            )}
          >
            <Trees className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-xs font-bold text-foreground">Open Plains</div>
              <div className="text-[10px] text-muted-foreground">Grassland & horizon</div>
            </div>
          </button>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-foreground">Particle Weather Effects</div>
            <div className="text-[11px] text-muted-foreground">
              Canvas particle simulation for rain, snow, wind gusts, and stars
            </div>
          </div>
          <button
            onClick={handleParticlesToggle}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative cursor-pointer border-none",
              particlesEnabled ? "bg-primary" : "bg-secondary"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                particlesEnabled ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* ─── Notifications Section ─── */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Notifications & Integrations Alerts
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage alerts for incoming coding duels, quiz battles, and assignments
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-bold text-foreground">Coding Duel Invitations</div>
              <div className="text-[11px] text-muted-foreground">Sound notification when a challenger matches</div>
            </div>
            <button
              onClick={() => setNotifyDuels(!notifyDuels)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative cursor-pointer border-none",
                notifyDuels ? "bg-primary" : "bg-secondary"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                  notifyDuels ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-border/60">
            <div>
              <div className="text-xs font-bold text-foreground">Google Classroom Deadlines</div>
              <div className="text-[11px] text-muted-foreground">Alert 24 hours before assignment due time</div>
            </div>
            <button
              onClick={() => setNotifyAssignments(!notifyAssignments)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative cursor-pointer border-none",
                notifyAssignments ? "bg-primary" : "bg-secondary"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                  notifyAssignments ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-border/60">
            <div>
              <div className="text-xs font-bold text-foreground">Google Calendar Meetings</div>
              <div className="text-[11px] text-muted-foreground">Pop-up reminders 15 minutes before meeting start</div>
            </div>
            <button
              onClick={() => setNotifyCalendar(!notifyCalendar)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative cursor-pointer border-none",
                notifyCalendar ? "bg-primary" : "bg-secondary"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                  notifyCalendar ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Profile Dialog Trigger ─── */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {currentUser?.displayName || "Naitik Yadav"}
            </h4>
            <p className="text-xs text-muted-foreground font-mono">
              {currentUser?.email || "naitik.yadav@university.edu"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsProfileOpen(true)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-xs cursor-pointer border-none"
        >
          Edit Profile
        </button>
      </div>

      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
};

export default DashboardSettings;

