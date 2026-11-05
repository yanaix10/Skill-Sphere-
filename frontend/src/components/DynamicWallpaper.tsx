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
  Eye,
  Mountain,
  Waves,
  Trees,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types & Configuration ──────────────────────────────────── */

export type LandscapeScene = "mountains" | "beaches" | "plains";
export type TimePhase = "day" | "sunset" | "night";
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
 * ASSET SLOTS:
 * Placeholders for user-uploaded assets in `/public/assets/landscapes/`.
 * When assets are dropped into `/public/assets/landscapes/`, the engine
 * immediately loads and prioritizes them over the built-in procedural SVG scenery.
 */
export const LANDSCAPE_ASSET_PATHS: Record<
  LandscapeScene,
  Record<TimePhase, string>
> = {
  mountains: {
    day: "/assets/landscapes/mountains-day.jpg",
    sunset: "/assets/landscapes/mountains-sunset.jpg",
    night: "/assets/landscapes/mountains-night.jpg",
  },
  beaches: {
    day: "/assets/landscapes/beaches-day.jpg",
    sunset: "/assets/landscapes/beaches-sunset.jpg",
    night: "/assets/landscapes/beaches-night.jpg",
  },
  plains: {
    day: "/assets/landscapes/plains-day.jpg",
    sunset: "/assets/landscapes/plains-sunset.jpg",
    night: "/assets/landscapes/plains-night.jpg",
  },
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
  if (hour >= 5 && hour < 7) return "sunset"; // dawn / golden hour
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "sunset"; // dusk
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

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Landscape Scene
  const [scene, setScene] = useState<LandscapeScene>(() => {
    return (localStorage.getItem("skillsphere_wallpaper_scene") as LandscapeScene) || "mountains";
  });

  // Weather & Time Engine State
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 20,
    weatherCode: 0,
    condition: "clear",
    isDay: true,
    windSpeed: 8,
    precipitation: 0,
    timePhase: "day",
    updatedAt: Date.now(),
  });

  // Simulation / Manual overrides
  const [simulationMode, setSimulationMode] = useState(false);
  const [overrideWeather, setOverrideWeather] = useState<WeatherCondition>("clear");
  const [overridePhase, setOverridePhase] = useState<TimePhase>("day");
  const [enableParticles, setEnableParticles] = useState(true);

  // Asset load state (checks if user has uploaded image assets)
  const [hasCustomAsset, setHasCustomAsset] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
          // Reverse geocoding via Open-Meteo or free nominatim
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
        // Default to Tokyo if location denied
        selectLocation(POPULAR_LOCATIONS[0]);
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
        const now = new Date();
        const localHour = now.getHours();
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
        temperature: 21,
      }));
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location);
      const interval = setInterval(() => fetchWeather(location), 15 * 60 * 1000); // 15 mins
      return () => clearInterval(interval);
    }
  }, [location, fetchWeather]);

  /* ─── Check custom asset availability ──────────────────────── */
  const activePhase = simulationMode ? overridePhase : weather.timePhase;
  const activeCondition = simulationMode ? overrideWeather : weather.condition;

  useEffect(() => {
    const assetUrl = LANDSCAPE_ASSET_PATHS[scene]?.[activePhase];
    if (assetUrl) {
      const img = new Image();
      img.src = assetUrl;
      img.onload = () => setHasCustomAsset(true);
      img.onerror = () => setHasCustomAsset(false);
    } else {
      setHasCustomAsset(false);
    }
  }, [scene, activePhase]);

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

    // Particle instances
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

    const count = activeCondition === "rain" ? 140 : activeCondition === "snow" ? 80 : activeCondition === "wind" ? 50 : activePhase === "night" ? 60 : 0;
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
        ctx.strokeStyle = "rgba(180, 220, 255, 0.45)";
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
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
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
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1.2;
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 35, p.y + (Math.sin(p.x * 0.02) * 4));
          ctx.stroke();

          p.x += p.speedX;
          if (p.x > width + 40) {
            p.x = -40;
            p.y = Math.random() * height;
          }
        });
      } else if (activePhase === "night") {
        // Twinkling night stars
        particles.forEach((p) => {
          if (p.swing !== undefined) p.swing += 0.03;
          const alpha = 0.2 + Math.abs(Math.sin(p.swing || 0)) * 0.6;
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
  }, [activeCondition, activePhase, enableParticles]);

  /* ─── Procedural Vector Landscapes (Fallback when custom assets absent) ─── */
  const renderLandscapeSvg = () => {
    if (scene === "mountains") {
      return (
        <svg
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-25 dark:opacity-30 transition-opacity duration-700"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          {/* Distant mountain ridge */}
          <polygon
            points="0,900 0,550 180,440 380,590 620,400 850,560 1100,430 1320,580 1440,510 1440,900"
            className={activePhase === "night" ? "fill-indigo-950/60" : activePhase === "sunset" ? "fill-orange-900/30" : "fill-sky-800/20"}
          />
          {/* Midground peaks */}
          <polygon
            points="0,900 0,640 220,530 460,670 730,500 980,680 1200,540 1440,660 1440,900"
            className={activePhase === "night" ? "fill-indigo-950/80" : activePhase === "sunset" ? "fill-amber-900/40" : "fill-slate-800/30"}
          />
          {/* Foreground foothills */}
          <polygon
            points="0,900 0,740 320,680 640,780 1020,700 1340,760 1440,720 1440,900"
            className={activePhase === "night" ? "fill-slate-950/90" : activePhase === "sunset" ? "fill-stone-900/50" : "fill-zinc-800/40"}
          />
        </svg>
      );
    } else if (scene === "beaches") {
      return (
        <svg
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-25 dark:opacity-30 transition-opacity duration-700"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          {/* Ocean horizon & calm waters */}
          <rect
            x="0"
            y="520"
            width="1440"
            height="380"
            className={activePhase === "night" ? "fill-blue-950/40" : activePhase === "sunset" ? "fill-amber-700/20" : "fill-cyan-800/20"}
          />
          {/* Wave contours */}
          <path
            d="M 0,620 Q 360,590 720,620 T 1440,620 L 1440,900 L 0,900 Z"
            className={activePhase === "night" ? "fill-indigo-950/70" : activePhase === "sunset" ? "fill-rose-900/30" : "fill-teal-800/25"}
          />
          {/* Shoreline sand contour */}
          <path
            d="M 0,720 Q 420,670 880,730 T 1440,710 L 1440,900 L 0,900 Z"
            className={activePhase === "night" ? "fill-slate-950/80" : activePhase === "sunset" ? "fill-amber-950/40" : "fill-emerald-950/20"}
          />
        </svg>
      );
    } else {
      // Plains
      return (
        <svg
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-20 dark:opacity-30 transition-opacity duration-700"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          {/* Distant rolling hills */}
          <path
            d="M 0,580 Q 400,510 800,570 T 1440,540 L 1440,900 L 0,900 Z"
            className={activePhase === "night" ? "fill-indigo-950/50" : activePhase === "sunset" ? "fill-amber-800/30" : "fill-emerald-800/20"}
          />
          {/* Midground rolling meadows */}
          <path
            d="M 0,670 Q 320,620 740,680 T 1440,650 L 1440,900 L 0,900 Z"
            className={activePhase === "night" ? "fill-slate-950/70" : activePhase === "sunset" ? "fill-amber-900/40" : "fill-green-900/25"}
          />
          {/* Foreground slopes */}
          <path
            d="M 0,760 Q 520,700 1050,780 T 1440,750 L 1440,900 L 0,900 Z"
            className={activePhase === "night" ? "fill-zinc-950/90" : activePhase === "sunset" ? "fill-stone-950/60" : "fill-stone-900/30"}
          />
        </svg>
      );
    }
  };

  /* ─── Sky Background Gradients by Phase ────────────────────── */
  const getSkyGradient = () => {
    if (activePhase === "night") {
      return "bg-gradient-to-b from-[#050814] via-[#090e1f] to-[#0d142b]";
    }
    if (activePhase === "sunset") {
      return "bg-gradient-to-b from-[#4a154b]/30 via-[#a33b5c]/20 to-[#e0813d]/20";
    }
    // Day
    return "bg-gradient-to-b from-sky-400/10 via-sky-200/5 to-transparent";
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* 1. Base Sky Gradient */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-colors duration-1000",
          getSkyGradient()
        )}
      />

      {/* 2. Custom User Asset (Prioritized if uploaded into /public/assets/landscapes/) */}
      {hasCustomAsset ? (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40 transition-opacity duration-700"
          style={{
            backgroundImage: `url(${LANDSCAPE_ASSET_PATHS[scene][activePhase]})`,
          }}
        />
      ) : (
        /* 3. High-Quality Procedural Vector Landscape */
        renderLandscapeSvg()
      )}

      {/* 4. Canvas Weather Particles (Rain / Snow / Wind / Stars) */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* 5. Main Foreground Content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden min-h-0">
        {children}
      </div>

      {/* 6. Live Location & Weather Status Pill (Bottom Right) */}
      <div className="absolute bottom-3 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsControlsOpen(!isControlsOpen)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all duration-200 cursor-pointer backdrop-blur-md",
            "bg-card/85 text-card-foreground border-border hover:bg-card hover:border-primary/50"
          )}
          title="Wallpaper & Weather Controls"
        >
          {location ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-semibold">{location.city}</span>
              <span className="text-muted-foreground">•</span>
              <span>{weather.temperature}°C</span>
              <span className="text-muted-foreground">•</span>
              {activeCondition === "rain" && <CloudRain className="w-3.5 h-3.5 text-blue-400" />}
              {activeCondition === "snow" && <Snowflake className="w-3.5 h-3.5 text-cyan-200" />}
              {activeCondition === "wind" && <Wind className="w-3.5 h-3.5 text-amber-400" />}
              {activeCondition === "cloudy" && <Cloud className="w-3.5 h-3.5 text-slate-400" />}
              {activeCondition === "clear" && (activePhase === "night" ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />)}
              <span className="capitalize text-muted-foreground text-[11px] hidden sm:inline">
                {activeCondition}
              </span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Set Location</span>
            </>
          )}
          <Sliders className="w-3 h-3 text-muted-foreground ml-1" />
        </button>
      </div>

      {/* 7. Controls & Simulation Popout Menu */}
      {isControlsOpen && (
        <div className="absolute bottom-12 right-4 z-40 w-80 p-3.5 rounded-2xl bg-card/95 border border-border shadow-2xl backdrop-blur-md text-card-foreground space-y-3.5 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">Dynamic Wallpaper Engine</span>
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

          {/* Landscape Scene Picker */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Landscape Scene</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: "mountains", label: "Mountains", icon: Mountain },
                  { id: "beaches", label: "Beaches", icon: Waves },
                  { id: "plains", label: "Plains", icon: Trees },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const isSelected = scene === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setScene(item.id);
                      localStorage.setItem("skillsphere_wallpaper_scene", item.id);
                    }}
                    className={cn(
                      "py-2 px-2 rounded-lg border text-center flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:bg-secondary/80"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Particle Effects Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-foreground font-medium">Weather Animations</span>
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

          {/* Simulation Mode Toggle (Test day, night, rain, snow, wind immediately) */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Simulator (Preview Effects)
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
                {/* Time of day */}
                <div className="flex gap-1">
                  {(["day", "sunset", "night"] as const).map((ph) => (
                    <button
                      key={ph}
                      onClick={() => setOverridePhase(ph)}
                      className={cn(
                        "flex-1 py-1 rounded text-[10px] font-semibold capitalize border cursor-pointer",
                        overridePhase === ph
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border"
                      )}
                    >
                      {ph}
                    </button>
                  ))}
                </div>

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

      {/* 8. Location Selection Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 text-card-foreground shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold m-0 text-foreground">Select Your Location</h3>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              We sync your wallpaper lighting, time of day, and weather effects to your local time and forecast.
            </p>

            {/* Geolocation Button */}
            <button
              onClick={detectLocation}
              disabled={detectingLocation}
              className="w-full py-2.5 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all cursor-pointer border-none"
            >
              <Compass className={cn("w-4 h-4", detectingLocation && "animate-spin")} />
              <span>{detectingLocation ? "Detecting Coordinates..." : "Use Current Location"}</span>
            </button>

            {/* Popular City Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Or choose a city:
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
