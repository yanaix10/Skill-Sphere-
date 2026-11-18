import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Bell,
  LogOut,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import useDynamicEnvironment, { WeatherState } from "./useDynamicEnvironment";
import WeatherCanvas from "./WeatherCanvas";

/**
 * 2. Asset Mapping: High-resolution Unsplash wallpapers
 * Curated for cinematic landscape aesthetic: coastal mountains, low-hanging fog, and weather conditions
 */
export const WEATHER_WALLPAPERS: Record<
  WeatherState,
  { day: string; night: string; description: string }
> = {
  clear: {
    day: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=80", // Sunny mountain valley
    night: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2560&q=80", // Starry alpine night
    description: "Clear mountain vistas",
  },
  "clouds/wind": {
    day: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=80", // Misty mountain ridge
    night: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=2560&q=80", // Moody coastal mountain with low fog at sunset/night
    description: "Coastal mountain with low-hanging fog",
  },
  rain: {
    day: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=2560&q=80", // Atmospheric misty rain over lake & cliffs
    night: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=2560&q=80", // Dark moody rain with glistening reflections
    description: "Rainy coastal storm",
  },
  snow: {
    day: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?auto=format&fit=crop&w=2560&q=80", // Majestic snow-capped ridges
    night: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=2560&q=80", // Quiet winter night on snowy mountains
    description: "Snow-covered peaks",
  },
};

interface SkillSphereLayoutProps {
  children?: React.ReactNode;
  userFullName?: string;
  userDisplayName?: string;
  onLogout?: () => void;
  onNavigate?: (route: string) => void;
  activeRoute?: string;
}

export const SkillSphereLayout: React.FC<SkillSphereLayoutProps> = ({
  children,
  userFullName = "Naitik Yadav",
  userDisplayName = "Naitik",
  onLogout,
  onNavigate,
  activeRoute = "Home",
}) => {
  const { locationName, temp, weatherState, isDay, loading, refresh } =
    useDynamicEnvironment();

  // Manual test override for previewing any weather & day/night state instantly
  const [testOverride, setTestOverride] = useState<{
    weatherState: WeatherState;
    isDay: boolean;
    temp?: number;
    label?: string;
  } | null>(null);

  // Read URL query params on mount for test deep links (e.g. ?weather=rain&isDay=false)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qWeather = params.get("weather") as WeatherState;
    const qDay = params.get("isDay");
    if (qWeather && ["clear", "rain", "snow", "clouds/wind"].includes(qWeather)) {
      setTestOverride({
        weatherState: qWeather,
        isDay: qDay !== null ? qDay === "true" : true,
        label: `Test: ${qWeather}`,
      });
    }
  }, []);

  const activeWeather = testOverride ? testOverride.weatherState : weatherState;
  const activeIsDay = testOverride ? testOverride.isDay : isDay;
  const activeTemp = testOverride?.temp !== undefined ? testOverride.temp : temp;

  // Active wallpaper resolution
  const targetBg = activeIsDay
    ? WEATHER_WALLPAPERS[activeWeather]?.day || WEATHER_WALLPAPERS.clear.day
    : WEATHER_WALLPAPERS[activeWeather]?.night || WEATHER_WALLPAPERS.clear.night;

  // Dual-layer state for seamless crossfading between wallpapers
  const [currentBg, setCurrentBg] = useState<string>(targetBg);
  const [prevBg, setPrevBg] = useState<string | null>(null);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);

  useEffect(() => {
    if (targetBg !== currentBg) {
      setPrevBg(currentBg);
      setCurrentBg(targetBg);
      setIsCrossfading(true);

      const timer = setTimeout(() => {
        setIsCrossfading(false);
        setPrevBg(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [targetBg, currentBg]);

  // Dynamic time-based greeting (Good Morning / Afternoon / Night)
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  // Weather state label & icon helper
  const getWeatherMeta = () => {
    switch (activeWeather) {
      case "rain":
        return {
          label: "Rain Shower",
          icon: <CloudRain className="w-5 h-5 text-sky-300 animate-pulse" />,
        };
      case "snow":
        return {
          label: "Snow Flurry",
          icon: <Snowflake className="w-5 h-5 text-indigo-200 animate-spin" style={{ animationDuration: "8s" }} />,
        };
      case "clouds/wind":
        return {
          label: activeIsDay ? "Misty Clouds" : "Low-Hanging Fog",
          icon: <Cloud className="w-5 h-5 text-gray-200" />,
        };
      case "clear":
      default:
        return activeIsDay
          ? {
              label: "Clear Day",
              icon: <Sun className="w-5 h-5 text-amber-300" />,
            }
          : {
              label: "Clear Night",
              icon: <Moon className="w-5 h-5 text-blue-200" />,
            };
    }
  };

  const weatherMeta = getWeatherMeta();

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col select-none text-white font-sans">
      {/* ─── 2. Asset Mapping & Background Layer (Crossfade Enabled) ─── */}
      {prevBg && (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out z-0 ${
            isCrossfading ? "opacity-0" : "opacity-100"
          }`}
          style={{ backgroundImage: `url("${prevBg}")` }}
        />
      )}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out z-0 opacity-100"
        style={{ backgroundImage: `url("${currentBg}")` }}
      />

      {/* Persistent Overlay: Semi-transparent black with subtle blur to guarantee text legibility */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-0 pointer-events-none" />

      {/* ─── 3. HTML5 Canvas Particle Engine ─── */}
      <WeatherCanvas weatherState={activeWeather} className="z-0" />

      {/* ─── 4. Main UI Layout (Always Crisp White Text) ─── */}

      {/* Top Nav */}
      <header className="relative z-10 w-full h-16 px-6 sm:px-8 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
        {/* Left: Green logo dot & Brand + Nav Links */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            <span className="text-white font-bold text-lg tracking-tight">
              SkillSphere
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1.5">
            {[
              { id: "Home", label: "Home" },
              { id: "Quizzes", label: "Quizzes & duels" },
              { id: "Friends", label: "Friends" },
            ].map((link) => {
              const isActive = activeRoute.toLowerCase() === link.id.toLowerCase();
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate?.(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/15 text-white shadow-sm border border-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Notifications, Avatar, Name & Logout */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <button
            title="Notifications"
            className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black/40" />
          </button>

          {/* User Avatar + Name */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-xs text-white ring-1 ring-white/30 shadow-md">
              {userFullName.charAt(0)}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-white tracking-wide">
              {userFullName}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all backdrop-blur-sm shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area: Center Focus Card or Injected Children */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {children ? (
          children
        ) : (
          /* Center Focus: Glassmorphic Greeting Card */
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 text-center border border-white/10 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {getGreeting()}, {userDisplayName}
            </h1>
            <p className="text-white/70 text-sm sm:text-base mt-2 font-normal">
              Welcome {userFullName}
            </p>
          </div>
        )}
      </main>

      {/* ─── Bottom-Left: Interactive Weather Test Switcher ─── */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-2xl text-xs">
        <span className="flex items-center gap-1 text-white/60 font-semibold uppercase text-[10px] tracking-wider pr-1">
          <Sparkles className="w-3 h-3 text-emerald-400" /> Test Modes:
        </span>
        <button
          onClick={() => setTestOverride(null)}
          className={`px-2 py-1 rounded-md transition-all font-medium ${
            testOverride === null
              ? "bg-emerald-500 text-white font-bold shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title="Return to real-time live weather"
        >
          ⚡ Live
        </button>
        <button
          onClick={() =>
            setTestOverride({ weatherState: "clear", isDay: true, temp: 28 })
          }
          className={`px-2 py-1 rounded-md transition-all font-medium ${
            testOverride?.weatherState === "clear" && testOverride.isDay
              ? "bg-amber-500 text-white font-bold"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          ☀️ Clear Day
        </button>
        <button
          onClick={() =>
            setTestOverride({ weatherState: "clear", isDay: false, temp: 18 })
          }
          className={`px-2 py-1 rounded-md transition-all font-medium ${
            testOverride?.weatherState === "clear" && !testOverride.isDay
              ? "bg-blue-600 text-white font-bold"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          🌙 Clear Night
        </button>
        <button
          onClick={() =>
            setTestOverride({ weatherState: "rain", isDay: false, temp: 16 })
          }
          className={`px-2 py-1 rounded-md transition-all font-medium ${
            testOverride?.weatherState === "rain"
              ? "bg-sky-600 text-white font-bold"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          🌧️ Rain
        </button>
        <button
          onClick={() =>
            setTestOverride({ weatherState: "snow", isDay: false, temp: -2 })
          }
          className={`px-2 py-1 rounded-md transition-all font-medium ${
            testOverride?.weatherState === "snow"
              ? "bg-indigo-600 text-white font-bold"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          ❄️ Snow
        </button>
        <button
          onClick={() =>
            setTestOverride({ weatherState: "clouds/wind", isDay: false, temp: 20 })
          }
          className={`px-2 py-1 rounded-md transition-all font-medium ${
            testOverride?.weatherState === "clouds/wind"
              ? "bg-teal-700 text-white font-bold"
              : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          🌫️ Fog
        </button>
      </div>

      {/* Bottom Right Widget: Geolocation & Live Ambient Weather */}
      <aside className="absolute bottom-6 right-6 z-10">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 shadow-xl flex items-center gap-3.5 text-white hover:border-white/20 transition-all">
          <div className="p-2 rounded-xl bg-white/10 border border-white/10">
            {weatherMeta.icon}
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span className="truncate max-w-[140px]">{locationName}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold tracking-tight text-white">
                {activeTemp !== null ? `${activeTemp}°C` : "--"}
              </span>
              <span className="text-[11px] text-white/60 font-medium border-l border-white/10 pl-2">
                {weatherMeta.label}
              </span>
            </div>
          </div>

          {loading && (
            <RefreshCw className="w-3.5 h-3.5 text-white/40 animate-spin ml-1" />
          )}
        </div>
      </aside>
    </div>
  );
};

export default SkillSphereLayout;
