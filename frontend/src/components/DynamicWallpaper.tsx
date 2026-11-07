import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Wind,
  Cloud,
  Compass,
  Sliders,
  Check,
  RefreshCw,
  X,
  Sunrise,
  Sunset as SunsetIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../context/ThemeContext";

/* ─── Types & Configuration ──────────────────────────────────── */

export type TimePhase = "morning" | "day" | "sunset" | "night";
export type WallpaperMode = "auto" | "morning" | "day" | "sunset" | "night";
export type WeatherCondition = "clear" | "cloudy" | "rain" | "snow" | "wind";

export interface UserLocation {
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone?: string;
  isCustom?: boolean;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  condition: WeatherCondition;
  isDay: boolean;
  windSpeed: number;
  precipitation: number;
  timePhase: TimePhase;
  updatedAt: number;
}

/**
 * 6K Big Sur Nature Mountains Day / Night cycle photographic assets
 */
export const MOUNTAIN_WALLPAPERS: Record<TimePhase, { url: string; label: string }> = {
  morning: { url: "/wallpapers/nature-mountains/assets/awv9qd8b44.jpg", label: "Morning" },
  day: { url: "/wallpapers/nature-mountains/assets/aet2mvheu7.jpg", label: "Day" },
  sunset: { url: "/wallpapers/nature-mountains/assets/a9utu601up.jpg", label: "Sunset" },
  night: { url: "/wallpapers/nature-mountains/assets/amhxxzhji0.jpg", label: "Night" },
};

export const POPULAR_LOCATIONS: UserLocation[] = [
  { city: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503, timezone: "Asia/Tokyo" },
  { city: "New York", country: "USA", lat: 40.7128, lon: -74.006, timezone: "America/New_York" },
  { city: "London", country: "UK", lat: 51.5074, lon: -0.1278, timezone: "Europe/London" },
  { city: "Paris", country: "France", lat: 48.8566, lon: 2.3522, timezone: "Europe/Paris" },
  { city: "Delhi", country: "India", lat: 28.6139, lon: 77.209, timezone: "Asia/Kolkata" },
  { city: "San Francisco", country: "USA", lat: 37.7749, lon: -122.4194, timezone: "America/Los_Angeles" },
  { city: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093, timezone: "Australia/Sydney" },
  { city: "Reykjavik", country: "Iceland", lat: 64.1466, lon: -21.9426, timezone: "Atlantic/Reykjavik" },
];

/* ─── Weather Code Parser ────────────────────────────────────── */

const parseWmoWeather = (code: number, windSpeed: number): WeatherCondition => {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) return "rain";
  if (windSpeed > 28) return "wind";
  if ([1, 2, 3, 45, 48].includes(code)) return "cloudy";
  return "clear";
};

const calculateTimePhase = (hour: number): TimePhase => {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "sunset";
  return "night";
};

/* ─── Main Dynamic Wallpaper Component ───────────────────────── */

interface DynamicWallpaperProps {
  children?: React.ReactNode;
}

export const DynamicWallpaper: React.FC<DynamicWallpaperProps> = ({ children }) => {
  // Location State
  const [location, setLocation] = useState<UserLocation | null>(() => {
    try {
      const stored = localStorage.getItem("skillsphere_wallpaper_location");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Wallpaper Mode: Auto (syncs with real clock) or manual freeze (Morning / Day / Sunset / Night)
  const [wallpaperMode, setWallpaperMode] = useState<WallpaperMode>(() => {
    try {
      return (localStorage.getItem("skillsphere_wallpaper_mode") as WallpaperMode) || "auto";
    } catch {
      return "auto";
    }
  });

  // Weather & Time Engine State
  const [weather, setWeather] = useState<WeatherData>(() => {
    const hour = new Date().getHours();
    return {
      temperature: 24,
      weatherCode: 0,
      condition: "clear",
      isDay: hour >= 6 && hour < 18,
      windSpeed: 8,
      precipitation: 0,
      timePhase: calculateTimePhase(hour),
      updatedAt: Date.now(),
    };
  });

  // Simulation / Manual overrides
  const [simulationMode, setSimulationMode] = useState(false);
  const [overrideWeather, setOverrideWeather] = useState<WeatherCondition>("clear");
  const [overridePhase, setOverridePhase] = useState<TimePhase>("sunset");
  const [enableParticles, setEnableParticles] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* ─── Clean legacy storage keys ────────────────────────────── */
  useEffect(() => {
    localStorage.removeItem("skillsphere_wallpaper_scene");
  }, []);

  /* ─── Save location ────────────────────────────────────────── */
  const selectLocation = (loc: UserLocation) => {
    setLocation(loc);
    localStorage.setItem("skillsphere_wallpaper_location", JSON.stringify(loc));
    setIsLocationModalOpen(false);
  };

  /* ─── Auto-Detect via Geolocation API ──────────────────────── */
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let city = "Local Area";
        let country = "";

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
          );
          if (res.ok) {
            const data = await res.json();
            city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "My Location";
            country = data.address?.country || "";
          }
        } catch {
          // fallback
        }

        const detected: UserLocation = {
          city,
          country,
          lat,
          lon,
        };
        selectLocation(detected);
        setDetectingLocation(false);
      },
      (err) => {
        console.warn("Geolocation permission denied or failed:", err);
        setDetectingLocation(false);
        selectLocation(POPULAR_LOCATIONS[4]); // Default to Delhi
      },
      { timeout: 8000 }
    );
  };

  /* ─── Fetch Real Weather Data ──────────────────────────────── */
  const fetchWeather = useCallback(async (loc: UserLocation) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const current = data.current;
        const localHour = new Date().getHours();
        const phase = calculateTimePhase(localHour);
        const condition = parseWmoWeather(current.weather_code, current.wind_speed_10m);

        setWeather({
          temperature: Math.round(current.temperature_2m),
          weatherCode: current.weather_code,
          condition,
          isDay: Boolean(current.is_day),
          windSpeed: current.wind_speed_10m,
          precipitation: current.precipitation || 0,
          timePhase: phase,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn("Weather API fetch error, using local time fallback:", err);
      const localHour = new Date().getHours();
      setWeather((prev) => ({
        ...prev,
        timePhase: calculateTimePhase(localHour),
        condition: "clear",
        temperature: 24,
      }));
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location);
      const interval = setInterval(() => fetchWeather(location), 15 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [location, fetchWeather]);

  /* ─── Active Phase Resolution ──────────────────────────────── */
  const getActivePhase = (): TimePhase => {
    if (simulationMode) return overridePhase;
    if (wallpaperMode !== "auto") return wallpaperMode;
    return weather.timePhase;
  };

  const activePhase = getActivePhase();
  const activeCondition = simulationMode ? overrideWeather : weather.condition;
  const currentWallpaperUrl = MOUNTAIN_WALLPAPERS[activePhase]?.url || MOUNTAIN_WALLPAPERS.sunset.url;

  /* ─── Canvas Particle Weather Animation ────────────────────── */
  useEffect(() => {
    if (!enableParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const onResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener("resize", onResize);

    interface Particle {
      x: number;
      y: number;
      length: number;
      speedY: number;
      speedX: number;
      size: number;
      opacity: number;
      swing?: number;
    }

    const count = activeCondition === "rain" ? 140 : activeCondition === "snow" ? 80 : activeCondition === "wind" ? 50 : activePhase === "night" ? 50 : 0;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: activeCondition === "rain" ? Math.random() * 20 + 10 : Math.random() * 3 + 1,
        speedY: activeCondition === "rain" ? Math.random() * 12 + 10 : activeCondition === "snow" ? Math.random() * 1.5 + 0.8 : (Math.random() - 0.5) * 0.5,
        speedX: activeCondition === "wind" ? Math.random() * 8 + 4 : activeCondition === "rain" ? -2 : (Math.random() - 0.5) * 0.8,
        size: activeCondition === "snow" ? Math.random() * 3 + 1.5 : Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        swing: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (activeCondition === "rain") {
        ctx.strokeStyle = isDark ? "rgba(180, 220, 255, 0.45)" : "rgba(50, 110, 180, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        particles.forEach((p) => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX, p.y + p.length);
          p.x += p.speedX;
          p.y += p.speedY;

          if (p.y > height) {
            p.y = -15;
            p.x = Math.random() * width;
          }
        });
        ctx.stroke();
      } else if (activeCondition === "snow") {
        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(120, 160, 200, 0.65)";
        particles.forEach((p) => {
          if (p.swing !== undefined) p.swing += 0.02;
          const swingX = p.swing ? Math.sin(p.swing) * 1.2 : 0;
          ctx.beginPath();
          ctx.arc(p.x + swingX, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speedY;
          p.x += p.speedX + swingX;

          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
        });
      } else if (activeCondition === "wind") {
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(60, 90, 130, 0.3)";
        ctx.lineWidth = 1.2;
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 35, p.y + Math.sin(p.x * 0.02) * 4);
          ctx.stroke();

          p.x += p.speedX;
          if (p.x > width + 40) {
            p.x = -40;
            p.y = Math.random() * height;
          }
        });
      } else if (activePhase === "night") {
        // Subtle twinkling stars
        particles.forEach((p) => {
          if (p.swing !== undefined) p.swing += 0.03;
          const alpha = 0.2 + Math.abs(Math.sin(p.swing || 0)) * 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [activeCondition, activePhase, enableParticles, isDark]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-background">
      {/* 1. 6K Nature Mountains Live Day/Night Cycle Wallpaper */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Crisp Native 6K Photographic Layer */}
        <img
          key={currentWallpaperUrl}
          src={currentWallpaperUrl}
          alt={`6K Nature Mountains (${activePhase})`}
          className={cn(
            "w-full h-full object-cover object-center transition-opacity duration-1000",
            activePhase === "night" && "brightness-110 contrast-105"
          )}
        />
      </div>

      {/* 2. Canvas Weather Particles (Rain / Snow / Wind / Stars) */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* 3. Main Foreground Content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden min-h-0">
        {children}
      </div>

      {/* 4. Live Location & Weather Status Pill (Bottom Right) */}
      <div className="absolute bottom-3 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium border border-border/80 shadow-md transition-all cursor-pointer backdrop-blur-md",
            "bg-card/85 text-foreground hover:bg-card hover:border-primary/50"
          )}
          title="Wallpaper & Weather Controls"
        >
          {location ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-foreground">{location.city}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono">{weather.temperature}°C</span>
              <span className="text-muted-foreground">•</span>
              {activeCondition === "rain" && <CloudRain className="w-3.5 h-3.5 text-muted-foreground" />}
              {activeCondition === "snow" && <Snowflake className="w-3.5 h-3.5 text-muted-foreground" />}
              {activeCondition === "wind" && <Wind className="w-3.5 h-3.5 text-muted-foreground" />}
              {activeCondition === "cloudy" && <Cloud className="w-3.5 h-3.5 text-muted-foreground" />}
              {activeCondition === "clear" && (activePhase === "night" ? <Moon className="w-3.5 h-3.5 text-muted-foreground" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />)}
              <span className="capitalize text-muted-foreground text-[11px] hidden sm:inline">
                {activePhase}
              </span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 text-primary" />
              <span>Set location</span>
            </>
          )}
          <Sliders className="w-3 h-3 text-muted-foreground ml-1" />
        </button>
      </div>

      {/* 5. Controls & Simulation Popout Menu */}
      {isControlsOpen && (
        <div className="absolute bottom-12 right-4 z-40 w-80 p-3.5 rounded-xl bg-card border border-border shadow-2xl backdrop-blur-md text-foreground space-y-3.5 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">6K Big Sur Wallpaper Engine</span>
            </div>
            <button
              onClick={() => setIsControlsOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Location Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Location</span>
              <button
                onClick={() => {
                  setIsLocationModalOpen(true);
                  setIsControlsOpen(false);
                }}
                className="text-[10px] text-primary hover:underline font-semibold cursor-pointer border-none bg-transparent p-0"
              >
                Change
              </button>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50 border border-border flex items-center justify-between text-xs">
              <span className="font-medium text-foreground truncate">
                {location ? `${location.city}, ${location.country}` : "No location selected"}
              </span>
              <button
                onClick={() => location && fetchWeather(location)}
                className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
                title="Refresh Weather"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 6K Nature Mountains Cycle Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Day / Night Cycle
              </span>
              <span className="text-[10px] text-primary font-medium capitalize">
                {wallpaperMode === "auto" ? `Auto (${activePhase})` : wallpaperMode}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(
                [
                  { id: "auto", label: "Auto" },
                  { id: "morning", label: "Dawn" },
                  { id: "day", label: "Day" },
                  { id: "sunset", label: "Sunset" },
                  { id: "night", label: "Night" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setWallpaperMode(item.id);
                    localStorage.setItem("skillsphere_wallpaper_mode", item.id);
                  }}
                  className={cn(
                    "py-1.5 rounded-md text-center text-[10px] font-semibold transition-all cursor-pointer border",
                    wallpaperMode === item.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Particle Effects Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-foreground font-medium">Atmospheric Weather</span>
            <button
              onClick={() => setEnableParticles(!enableParticles)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative cursor-pointer border-none",
                enableParticles ? "bg-primary" : "bg-secondary"
              )}
            >
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform",
                  enableParticles ? "left-5.5" : "left-1"
                )}
              />
            </button>
          </div>

          {/* Simulator */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Simulator (Weather Overrides)
              </span>
              <button
                onClick={() => setSimulationMode(!simulationMode)}
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer border-none",
                  simulationMode
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {simulationMode ? "Active" : "Off"}
              </button>
            </div>

            {simulationMode && (
              <div className="space-y-2 p-2 rounded-lg bg-secondary/40 border border-border">
                {/* Weather condition */}
                <div className="grid grid-cols-5 gap-1">
                  {(["clear", "cloudy", "rain", "snow", "wind"] as const).map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setOverrideWeather(cond)}
                      className={cn(
                        "py-1 rounded text-[9px] font-bold uppercase border cursor-pointer",
                        overrideWeather === cond
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border"
                      )}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Location Selection Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 text-card-foreground shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Select Location</h3>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Geolocation Auto-detect */}
            <button
              onClick={detectLocation}
              disabled={detectingLocation}
              className="w-full py-2.5 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 border-none shadow-sm"
            >
              <Compass className={cn("w-4 h-4", detectingLocation && "animate-spin")} />
              <span>{detectingLocation ? "Detecting GPS location..." : "Auto-detect My Location"}</span>
            </button>

            {/* Popular Cities */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Popular Cities
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc.city}
                    onClick={() => selectLocation(loc)}
                    className="w-full py-2 px-3 rounded-lg bg-secondary/50 hover:bg-secondary text-left flex items-center justify-between text-xs transition-colors cursor-pointer border border-border/60"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{loc.city}</span>
                      <span className="text-muted-foreground text-[10px] ml-1.5">{loc.country}</span>
                    </div>
                    {location?.city === loc.city && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicWallpaper;
