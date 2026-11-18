import React, { useState } from "react";
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Check,
  Bell,
  Sliders,
  User,
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
    <div className="space-y-5 max-w-3xl mx-auto pb-8 text-foreground">
      {/* Settings Header */}
      <div className="pb-3 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span>Settings</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your interface theme, environment effects, and notification preferences.
          </p>
        </div>
      </div>

      {/* ─── Appearance & Theme Section ─── */}
      <section className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">
            Theme & Appearance
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {/* Light Theme */}
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-18 sm:h-20",
              theme === "light"
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <Sun className="w-4 h-4 text-amber-500" />
              {theme === "light" && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-medium text-foreground">Light</div>
            </div>
          </button>

          {/* Dark Theme */}
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-18 sm:h-20",
              theme === "dark"
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <Moon className="w-4 h-4 text-sky-400" />
              {theme === "dark" && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-medium text-foreground">Dark</div>
            </div>
          </button>

          {/* System Theme */}
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={cn(
              "p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-18 sm:h-20",
              theme === "system"
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <Laptop className="w-4 h-4 text-muted-foreground" />
              {theme === "system" && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-medium text-foreground">
                System <span className="text-[10px] text-muted-foreground hidden sm:inline">({resolvedTheme})</span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* ─── Wallpaper Engine Settings ─── */}
      <section className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">
            Dynamic Wallpaper Engine
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleSceneChange("mountains")}
            className={cn(
              "px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5",
              wallpaperScene === "mountains"
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <Mountain className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-foreground truncate">
              Alpine mountains
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSceneChange("beaches")}
            className={cn(
              "px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5",
              wallpaperScene === "beaches"
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <Waves className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-foreground truncate">
              Coastal beach
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSceneChange("plains")}
            className={cn(
              "px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5",
              wallpaperScene === "plains"
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:bg-muted/50"
            )}
          >
            <Trees className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-foreground truncate">
              Open plains
            </span>
          </button>
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Particle weather effects</span>
          <button
            type="button"
            onClick={handleParticlesToggle}
            className={cn(
              "w-9 h-5 rounded-full transition-colors relative cursor-pointer border-none shrink-0",
              particlesEnabled ? "bg-primary" : "bg-muted border border-border"
            )}
            title="Toggle particle weather effects"
          >
            <span
              className={cn(
                "block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75",
                particlesEnabled ? "left-4.5" : "left-1"
              )}
            />
          </button>
        </div>
      </section>

      {/* ─── Notifications Section ─── */}
      <section className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-2xs space-y-3.5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">
            Notification Preferences
          </h3>
        </div>

        <div className="divide-y divide-border/60">
          <div className="flex items-center justify-between py-2.5">
            <div>
              <div className="text-xs font-semibold text-foreground">Coding Duel Invitations</div>
              <div className="text-[11px] text-muted-foreground">Sound and alert when a challenger matches</div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyDuels(!notifyDuels)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors relative cursor-pointer border-none shrink-0",
                notifyDuels ? "bg-primary" : "bg-muted border border-border"
              )}
            >
              <span
                className={cn(
                  "block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75",
                  notifyDuels ? "left-4.5" : "left-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div>
              <div className="text-xs font-semibold text-foreground">Google Classroom Deadlines</div>
              <div className="text-[11px] text-muted-foreground">Alert 24 hours before coursework due time</div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyAssignments(!notifyAssignments)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors relative cursor-pointer border-none shrink-0",
                notifyAssignments ? "bg-primary" : "bg-muted border border-border"
              )}
            >
              <span
                className={cn(
                  "block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75",
                  notifyAssignments ? "left-4.5" : "left-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div>
              <div className="text-xs font-semibold text-foreground">Google Calendar Meetings</div>
              <div className="text-[11px] text-muted-foreground">Pop-up reminders 15 minutes before event start</div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyCalendar(!notifyCalendar)}
              className={cn(
                "w-9 h-5 rounded-full transition-colors relative cursor-pointer border-none shrink-0",
                notifyCalendar ? "bg-primary" : "bg-muted border border-border"
              )}
            >
              <span
                className={cn(
                  "block w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75",
                  notifyCalendar ? "left-4.5" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Profile Dialog Trigger ─── */}
      <section className="p-4 rounded-xl bg-card border border-border shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-primary/20">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {currentUser?.displayName || "Developer"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {currentUser?.email || "No email connected"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-2xs cursor-pointer border-none shrink-0"
        >
          Edit Profile
        </button>
      </section>

      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
};

export default DashboardSettings;
