import { useState, useEffect, useCallback } from "react";

export type WeatherState = "clear" | "rain" | "snow" | "clouds/wind";

export interface DynamicEnvironment {
  locationName: string;
  temp: number | null;
  weatherState: WeatherState;
  isDay: boolean;
  loading: boolean;
  coords: { lat: number; lon: number };
  refresh: () => void;
}

// Default fallback coordinates: Amaravati / Kuragallu, Andhra Pradesh, India
const DEFAULT_COORDS = { lat: 16.5, lon: 80.6 };
const DEFAULT_LOCATION_NAME = "Amaravati, IN";

/**
 * Maps WMO weather interpretation code to 4 simplified states:
 * - clear: 0, 1
 * - clouds/wind: 2, 3, 45, 48
 * - rain: 51-67, 80-82, 95-99
 * - snow: 71-77, 85, 86
 */
export const mapWmoToWeatherState = (code: number): WeatherState => {
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "snow";
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return "rain";
  }
  if ([2, 3, 45, 48].includes(code)) {
    return "clouds/wind";
  }
  return "clear";
};

export const useDynamicEnvironment = (): DynamicEnvironment => {
  const [coords, setCoords] = useState<{ lat: number; lon: number }>(DEFAULT_COORDS);
  const [locationName, setLocationName] = useState<string>(DEFAULT_LOCATION_NAME);
  const [temp, setTemp] = useState<number | null>(24);
  const [weatherState, setWeatherState] = useState<WeatherState>("clouds/wind");
  const [isDay, setIsDay] = useState<boolean>(() => {
    const hr = new Date().getHours();
    return hr >= 6 && hr < 18;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Geolocation detection with fallback to Amaravati (16.5, 80.6)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!navigator.geolocation) {
      setCoords(DEFAULT_COORDS);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: Number(position.coords.latitude.toFixed(4)),
          lon: Number(position.coords.longitude.toFixed(4)),
        });
      },
      (err) => {
        console.warn("[useDynamicEnvironment] Geolocation blocked or failed, using Amaravati default:", err.message);
        setCoords(DEFAULT_COORDS);
      },
      { timeout: 7000, maximumAge: 300000 }
    );
  }, []);

  // 2. Reverse geocoding for human-readable city name
  useEffect(() => {
    let isMounted = true;

    const reverseGeocode = async () => {
      // Fast path for default coordinates
      if (Math.abs(coords.lat - DEFAULT_COORDS.lat) < 0.1 && Math.abs(coords.lon - DEFAULT_COORDS.lon) < 0.1) {
        if (isMounted) setLocationName("Amaravati, IN");
        return;
      }

      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=en`
        );
        if (res.ok) {
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || "Unknown";
          const country = data.countryCode || data.countryName || "";
          if (isMounted && city) {
            setLocationName(country ? `${city}, ${country}` : city);
            return;
          }
        }
      } catch (e) {
        console.warn("[useDynamicEnvironment] Reverse geocoding network error, fallback to coordinates:", e);
      }

      if (isMounted) {
        setLocationName(`${coords.lat.toFixed(1)}°N, ${coords.lon.toFixed(1)}°E`);
      }
    };

    reverseGeocode();

    return () => {
      isMounted = false;
    };
  }, [coords]);

  // 3. Live Weather Fetch from Open-Meteo
  const fetchWeather = useCallback(async () => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,is_day`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Weather fetch failed with status ${res.status}`);

      const data = await res.json();
      if (data?.current) {
        const rawTemp = data.current.temperature_2m;
        const code = Number(data.current.weather_code);
        const dayVal = data.current.is_day === 1;

        setTemp(typeof rawTemp === "number" ? Math.round(rawTemp) : 22);
        setWeatherState(mapWmoToWeatherState(code));
        setIsDay(dayVal);
      }
    } catch (err) {
      console.warn("[useDynamicEnvironment] Weather API failed, using fallback environment:", err);
      // Sensible time-based fallback if offline
      const hr = new Date().getHours();
      setIsDay(hr >= 6 && hr < 18);
      setWeatherState("clouds/wind");
    } finally {
      setLoading(false);
    }
  }, [coords]);

  useEffect(() => {
    fetchWeather();
    // Refresh weather every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return {
    locationName,
    temp,
    weatherState,
    isDay,
    loading,
    coords,
    refresh: fetchWeather,
  };
};

export default useDynamicEnvironment;

